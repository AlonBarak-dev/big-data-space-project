import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";

import MDBox from "../components/MDBox";
import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import Card from "@mui/material/Card";

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
            <Card>
              <MDBox mx={2} my={2}>
                <h3>Sun Description</h3>
                <p>{jsonData["sunDescription"]}</p>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <Card>
              <Image image_path={jsonData["activityImagePath"]} title="Sun Activity" />
            </Card>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <Card>
              <MDBox mx={2} my={2}>
                <h3>Details</h3>
                <p>
                  Right Ascension: {jsonData["rightAscension"]} <br />
                  Declination: {jsonData["declination"]} <br />
                  Constellation: {jsonData["constellation"]} <br />
                  Magnitude: {jsonData["magnitude"]} <br />
                </p>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <Card>
              <Image image_path={jsonData["positionImagePath"]} title="Sun Position" />
            </Card>
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
    <MDBox mx={2} my={2}>
      <h3>{title}</h3>
      <img src={image_path} style={imgStyle} />
    </MDBox>
  );
};
