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
        const response = await fetch("/get_neos_24_hours");
        const data = await response.json();
        setJsonData(data.neos);

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

  const neosSet = removeDuplicateObjects(jsonData);
  console.log("Neo List Result: ", neosSet);

  return (
    <DataTable
      table={{
        columns: [
          { Header: "name", accessor: "name" },
          { Header: "approach date", accessor: "approach_date" },
          { Header: "is hazardous", accessor: "is_potentially_hazardous" },
          { Header: "magnitude", accessor: "magnitude" },
          { Header: "max extimated size", accessor: "estimated_max_diameter_size_meters" },
          { Header: "min extimated size", accessor: "estimated_min_diameter_size_meters" },
        ],
        rows: neosSet,
      }}
    />
  );
};

function removeDuplicateObjects(list) {
  const uniqueObjects = [];
  const uniqueNames = new Set();

  for (const obj of list) {
    const name = obj.name;
    if (!uniqueNames.has(name)) {
      uniqueNames.add(name);
      uniqueObjects.push(obj);
    }
  }

  return uniqueObjects;
}

export default NeoList;
