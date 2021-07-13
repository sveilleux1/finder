import { useEffect, useState } from "react";
import { getTxs } from "../scripts/collector";

const useGetTxs = (
  startDate: Date,
  endDate: Date,
  address: string,
  chainId: string
) => {
  const [list, setList] = useState<TxResponse[]>();
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const fetchData = async () => {
      const data = await getTxs(address, chainId, startDate);
      if (data) {
        setList(data);
        setLoading(false);
      }
    };
    fetchData();
  }, [address, chainId, startDate]);

  const txs = list?.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return (
      txDate.valueOf() >= startDate.valueOf() &&
      txDate.valueOf() <= endDate.valueOf()
    );
  });

  return { txs, loading };
};

export default useGetTxs;
