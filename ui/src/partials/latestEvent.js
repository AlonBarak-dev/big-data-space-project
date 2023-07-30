import React from "react";

import "react-loading-skeleton/dist/skeleton.css";

import MDBox from "../components/MDBox";
import { Card } from "@mui/material";

const LatestEvent = (lastEvent) => {
  lastEvent = lastEvent.lastEvent;
  if (!lastEvent) {
    return (
      <Card>
        <MDBox>
          <p>No event!</p>
        </MDBox>
      </Card>
    );
  }

  console.log(lastEvent);
  var bgColor = lastEvent["urg"] >= 4 ? "red" : "info";

  return (
    <MDBox mb={1.5} py={3} px={1.5} color={"white"} bgColor={bgColor} borderRadius={10}>
      <p>
        Date: {lastEvent["date"]}
        <br />
        Location: {lastEvent["location"]}
        <br />
        Notifying Factor: {lastEvent["notfac"]}
        <br />
        Type: {lastEvent["type"]}
        <br />
        Urgency: {lastEvent["urg"]}
        <br />
      </p>
    </MDBox>
  );
};

export default LatestEvent;
