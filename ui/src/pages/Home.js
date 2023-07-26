import React, { useEffect, useState } from "react";

import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";

import EventListView from "partials/eventList";
import SunForcastPartial from "partials/sunForcast";
import LatestEvent from "partials/latestEvent";

const Home = () => {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={6}>
          <LatestEvent />
        </Grid>
        <Grid item xs={12} md={12} lg={6}>
          <SunForcastPartial />
        </Grid>
        <Grid item xs={12} md={12} lg={8}>
          <EventListView />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default Home;
