import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import MDBox from "../components/MDBox";
import { Card } from "@mui/material";

const LatestEvent = () => {
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
        <p>Failed to retrieve latest event</p>
      </Card>
    );
  }

  const eventList = jsonData["events"];
  const lastEvent = eventList[eventList.length - 1];

  var bgColor = lastEvent["urgancy"] >= 4 ? "red" : "info";

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
