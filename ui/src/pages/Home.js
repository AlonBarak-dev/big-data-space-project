import React, { useEffect, useState } from "react";

import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";

import EventListView from "partials/eventList";
import SunForcastPartial from "partials/sunForcast";
import LatestEvent from "partials/latestEvent";
import NeoList from "partials/neolist";

const Home = () => {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={6}>
          <h3>Latest Event</h3>
          <LatestEvent />
        </Grid>
        <Grid item xs={12} md={12} lg={6}>
          <h3>Sun Forcast</h3>
          <SunForcastPartial />
        </Grid>
        <Grid item xs={12} md={12} lg={8}>
          <h3>Events</h3>
          <EventListView />
        </Grid>
        <Grid item xs={12} md={12} lg={4}>
          <h3>Near Earth Objects</h3>
          <NeoList />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default Home;
