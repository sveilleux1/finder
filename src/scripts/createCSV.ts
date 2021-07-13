import { path } from "ramda";
import BigNumber from "bignumber.js";
import { Coin } from "@terra-money/terra.js";
import { format as formatDate } from "date-fns";
import { getMatchLog } from "../logfinder/format";
import { LogFinderResult, LogFindersRuleSet } from "../logfinder/types";
import format from "./format";

interface Column {
  dataIndex: string[];
  title: string;
  render?: (value: string, tx: LogFinderResult) => string;
}

const HEAD = "data:text/csv;charset=utf-8";

const createCSV = (
  address: string,
  txs: TxResponse[] | undefined,
  whitelist: Whitelist,
  ruleArray: LogFindersRuleSet[]
) => {
  const list: Whitelist[] = Object.values(whitelist).map(data => data);

  const logArray = txs?.map(tx =>
    getMatchLog(JSON.stringify(tx), ruleArray, address)
  );

  if (logArray) {
    const defaultColumns: Column[] = [
      {
        dataIndex: ["timestamp"],
        title: "datetime",
        render: value => formatDate(new Date(value), "M/d/yyyy H:mm")
      },
      {
        dataIndex: ["msgType"],
        title: "type"
      }
    ];

    const csv = {
      children: "CSV",
      href: initCSV(defaultColumns, logArray, list)
    };

    return csv;
  }
};

export default createCSV;

const initCSV = (
  columns: Column[],
  logArray: (LogFinderResult[] | undefined)[],
  list: Whitelist[]
) => {
  const logs = logArray.flat().filter(log => log !== undefined);

  const amounts = logs
    .map(log => log?.transformed?.amountIn)
    .concat(logs.map(log => log?.transformed?.amountOut));

  const tokens = amounts.map(
    amount => amount && getAmountColumn(amount?.trim(), list)
  );
  const denoms: string[][] = [];

  tokens.forEach(token => {
    if (token) {
      denoms.push(Object.keys(token));
    }
  });

  const csvHead = denoms
    .flat()
    .filter((str, index) => denoms.flat().indexOf(str) === index);

  const amountCols: Column[] = csvHead.map(head => ({
    dataIndex: [head],
    title: head
  }));

  const headings: string[] = [...columns, ...amountCols].map(
    ({ title }) => title
  );

  const rowArray = logs.map(
    data =>
      data &&
      [...columns, ...amountCols].map(({ dataIndex, render }) => {
        const value = path(
          dataIndex,
          dataIndex[0] !== "timestamp" ? data.transformed : data
        ) as string;
        const amountIn = data.transformed?.amountIn?.trim();
        const amountOut = data.transformed?.amountOut?.trim();

        if (value) {
          return render?.(value, data) ?? value;
        } else {
          const amountInArray = amountIn?.split(",").map(amount => {
            const amountColumn = getAmountColumn(amount.trim(), list);
            const str = path(dataIndex, amountColumn) as string;
            return str ? `+ ${str}` : undefined;
          });
          const amountOutArray = amountOut?.split(",").map(amount => {
            const amountColumn = getAmountColumn(amount.trim(), list);
            const str = path(dataIndex, amountColumn) as string;
            return str ? `- ${str}` : undefined;
          });
          return amountInArray
            ?.concat(amountOutArray)
            .flat()
            .filter(str => str !== undefined);
        }
      })
  );

  const content = rowArray
    .filter(rows => rows?.length !== 0)
    .map(rows => rows && rows.join(","));

  const csv = [HEAD, [headings, ...content].join("\n")].join();
  if (content?.length !== 0) {
    return encodeURI(csv);
  }
};

const TerraAddressRegExp = /(terra[0-9][a-z0-9]{38})/g;
const getAmountColumn = (amount: string, list: Whitelist[]) => {
  try {
    const coinData = Coin.fromString(amount);
    const value = new BigNumber(coinData.amount.toString()).div(1e6);
    const denom = format.denom(coinData.denom);
    return {
      [denom]: `${value} ${denom}`
    };
  } catch {
    const value = amount.replace(TerraAddressRegExp, "");
    const token = amount.match(TerraAddressRegExp)?.[0];
    if (token) {
      const data = renderAmount(value, token, list);
      return (
        data && {
          [data.symbol]: `${data.value} ${data.symbol}`
        }
      );
    }
  }
};

const renderAmount = (amount: string, token: string, list: Whitelist[]) => {
  const value = new BigNumber(amount).div(1e6);

  for (const tokenData of list) {
    if (token === tokenData.token) {
      const symbol = tokenData.symbol;
      return { value, symbol };
    }
  }
};
