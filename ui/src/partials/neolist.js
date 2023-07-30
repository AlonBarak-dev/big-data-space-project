import { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";

import DataTable from "examples/Tables/DataTable";
import { Card } from "@mui/material";
import MDBox from "components/MDBox";

const NeoList = () => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/get_neos");
        const data = await response.json();
        setJsonData(data.neo_list);

        setLoading(false);
      } catch (error) {
        console.error("Error retrieving JSON data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Skeleton />;
  }

  if (!jsonData) {
    return (
      <Card>
        <MDBox px={3} py={3}>
          <p>Failed to load neo list</p>
        </MDBox>
      </Card>
    );
  }

  if (jsonData.length <= 0) {
    return <p>No Neos Found!</p>;
  }

  return (
    <DataTable
      table={{
        columns: [
          { Header: "name", accessor: "name", width: "30%" },
          { Header: "approach date", accessor: "approach_date", width: "30%" },
          { Header: "is hazardous", accessor: "is_potentially_hazardous" },
        ],
        rows: jsonData,
      }}
    />
  );
};

export default NeoList;
