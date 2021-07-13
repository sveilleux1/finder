import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import c from "classnames";
import { useRecoilValue } from "recoil";
import ExtLink from "../components/ExtLink";
import createCSV from "../scripts/createCSV";
import useGetTxs from "../hooks/useGetTxs";
import { Whitelist } from "../store/WhitelistStore";
import { LogfinderRuleSet } from "../store/LogfinderRuleSetStore";
import { useNetwork } from "../HOCs/WithFetch";
import s from "./DownloadCSV.module.scss";
import "./DatePicker.scss";

const DownloadCSV = ({ address }: { address: string }) => {
  const [startDate, setStartDate] = useState<any>(new Date().setHours(0, 0, 0));
  const [endDate, setEndDate] = useState<any>(new Date());
  const chainId = useNetwork();
  const { txs } = useGetTxs(startDate, endDate, address, chainId);
  const ruleArray = useRecoilValue(LogfinderRuleSet);
  const whitelist = useRecoilValue(Whitelist);
  const csvData = createCSV(address, txs, whitelist, ruleArray);

  useEffect(() => {
    if (startDate.valueOf() > endDate.valueOf()) {
      setStartDate(endDate.setHours(0, 0, 0));
    }
  }, [startDate, endDate]);

  return (
    <section className={s.dateWrapper}>
      <div className={s.dateSelect}>
        <DatePicker
          className={c(s.dateComponent, s.startDateInput)}
          selected={startDate}
          onChange={date => date && setStartDate(date)}
        />
        ~
        <DatePicker
          className={s.dateComponent}
          selected={endDate}
          onChange={date => date && setEndDate(date)}
        />
      </div>
      <ExtLink href={csvData?.href} download={`${csvData?.children}.csv`}>
        <button className={s.csvButton} disabled={csvData?.href ? false : true}>
          Download CSV
        </button>
      </ExtLink>
    </section>
  );
};

export default DownloadCSV;
