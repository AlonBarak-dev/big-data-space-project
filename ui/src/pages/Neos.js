import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";

import MDBox from "../components/MDBox";
import DataTable from "../examples/Tables/DataTable";
import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";

const Neos = () => {
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
    return (
      <DashboardLayout>
        <Skeleton />
      </DashboardLayout>
    );
  }

  console.log("jsonData: ", jsonData);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12} lg={4}>
            <h3>Near Earth Objects</h3>
            {jsonData ? (
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
            ) : (
              <p>Failed loading NEOs</p>
            )}
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
};

export default Neos;
