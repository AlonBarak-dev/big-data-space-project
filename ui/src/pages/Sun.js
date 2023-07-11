import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";

import MDBox from "../components/MDBox";
import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import { object } from "prop-types";

const SunForcast = () => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/sun");
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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            <MDBox>
              <h3>Sun Description</h3>
              <p>{jsonData["sunDescription"]}</p>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <Image image_path={jsonData["activityImagePath"]} title="Sun Activity" />
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <MDBox>
              <h3>Sun Description</h3>
              <p>{jsonData["sunDescription"]}</p>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <Image image_path={jsonData["positionImagePath"]} title="Sun Position" />
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
};

export default SunForcast;

const Image = (args) => {
  const { image_path, title } = args;
  const imgStyle = {
    objectFit: "cover",
    maxWidth: 700,
    maxHeight: 700,
  };

  return (
    <MDBox>
      <h3>{title}</h3>
      <img src={image_path} style={imgStyle} />
    </MDBox>
  );
};
