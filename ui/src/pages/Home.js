import React, { useEffect, useState } from "react";
import io from "socket.io-client";

import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";

import EventListView from "partials/eventList";
import SunForcastPartial from "partials/sunForcast";
import LatestEvent from "partials/latestEvent";
import NeoList from "partials/neolist";
import EventsDistBarPlot from "partials/EventDistBarPlot";

const Home = () => {
  const [lastEvent, setLatestEvent] = useState(null);

  useEffect(() => {
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("Connected to the first server.");
    });

    socket.on("new-message", (message) => {
      message = JSON.parse(message);
      console.log("Received new message: ", message);
      setLatestEvent(message);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from the first server.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={12}>
          <h3>Latest Event</h3>
          <LatestEvent lastEvent={lastEvent} />
        </Grid>
        <Grid item xs={12} md={12} lg={6}>
          <EventsDistBarPlot
            dataSourceUrl="/countByUrgency"
            title="Events Distribution"
            description="The distribution of events for the last week based on urgency"
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={12} lg={6}>
          <EventsDistBarPlot
            dataSourceUrl="/get_neos_last_month_by_diameter"
            title="Neo Disribution"
            description="The distribution of NES's for the last month based on size"
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <h3>Events</h3>
          <EventListView />
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <h3>Near Earth Objects (Next 24 Hours)</h3>
          <NeoList />
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <h3>Sun Forcast</h3>
          <SunForcastPartial />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default Home;
