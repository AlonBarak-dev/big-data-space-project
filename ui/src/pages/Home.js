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

const Home = () => {
  const [lastEvent, setLatestEvent] = useState(null);

  useEffect(() => {
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("Connected to the first server.");
    });

    socket.on("new-message", (message) => {
      console.log("Received new message from Kafka:", message);
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
        <Grid item xs={12} md={12} lg={6}>
          <h3>Latest Event</h3>
          <LatestEvent lastEvent={lastEvent} />
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
