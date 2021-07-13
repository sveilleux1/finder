import axios from "axios";
import { fcdUrl } from "./utility";

export const getTxs = async (
  address: string,
  chainId: string,
  startDate: Date,
  offset: number = 0
) => {
  const fcd = fcdUrl(chainId);
  const url = `/v1/txs?offset=${offset}&limit=500&account=${address}&chainId=${chainId}`;

  try {
    const result = await axios.get(fcd + url);

    if (result.data === null) {
      throw new Error("Data is null");
    }

    let txs: TxResponse[] = result.data.txs;
    const next = result.data.next;
    const lastTx = txs[txs.length - 1];
    const date = new Date(lastTx.timestamp);

    if (date.valueOf() > startDate.valueOf() && next) {
      const data = await getTxs(address, chainId, startDate, next);
      txs = txs.concat(data.slice());
    }

    return txs.slice();
  } catch (error) {
    throw new Error(error);
  }
};
