import { useState, useEffect } from "react";

import Skeleton from "react-loading-skeleton";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

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
    return (
      <DashboardLayout>
        <Skeleton />
      </DashboardLayout>
    );
  }

  const eventList = jsonData["events"];

  if (eventList.length == 0) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <h3>No Events!</h3>
      </DashboardLayout>
    );
  }

  return (
    <DataTable
      table={{
        columns: [
          { Header: "date", accessor: "date", width: "20%" },
          { Header: "location", accessor: "location", width: "20%" },
          { Header: "notifying factor", accessor: "notfac", width: "20%" },
          { Header: "type", accessor: "type", width: "20%" },
          { Header: "urgancy", accessor: "urg", width: "20%" },
        ],
        rows: eventList.reverse(),
      }}
    />
  );
};

export default EventListView;
