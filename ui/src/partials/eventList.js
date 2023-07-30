import { useState, useEffect } from "react";

import Skeleton from "react-loading-skeleton";

import DataTable from "examples/Tables/DataTable";
import { Card } from "@mui/material";
import MDBox from "components/MDBox";

const EventListView = () => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/get_event_list");
        const data = await response.json();
        setJsonData(data);

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
          <p>Failed to load events</p>
        </MDBox>
      </Card>
    );
  }

  const eventList = jsonData["events"];

  if (eventList.length == 0) {
    return <h3>No Events!</h3>;
  }

  return (
    <DataTable
      table={{
        columns: [
          { Header: "date", accessor: "date", width: "20%" },
          { Header: "location", accessor: "location", width: "20%" },
          { Header: "notifying factor", accessor: "notfac", width: "20%" },
          { Header: "type", accessor: "type", width: "20%" },
          { Header: "urgency", accessor: "urg", width: "20%" },
        ],
        rows: eventList,
      }}
    />
  );
};

export default EventListView;
