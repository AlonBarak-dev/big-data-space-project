import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Grid } from "@mui/material";
import Card from "@mui/material/Card";

import MDBox from "../components/MDBox";
import DataTable from "../examples/Tables/DataTable";
import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import TimelineItem from "../examples/Timeline/TimelineItem";

const Home = () => {
  const [jsonData, setJsonData] = useState(null);
  const [sunData, setSunData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/get_event_list");
        const data = await response.json();
        setJsonData(data);

        const sun_response = await fetch("/sun");
        const sun_data = await sun_response.json();
        setSunData(sun_data);

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
  const lastEvent = eventList[eventList.length - 1];
  console.log(eventList);

  if (eventList.length == 0) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <h3>No Events!</h3>
      </DashboardLayout>
    );
  }

  var bgColor = lastEvent["urgancy"] >= 4 ? "red" : "info";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={6}>
          <h3>Latest Event</h3>
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
              Urgancy: {lastEvent["urgancy"]}
              <br />
            </p>
          </MDBox>
        </Grid>
        <Grid item xs={12} md={12} lg={6}>
          <h3>Sun Forcast</h3>
          <MDBox mb={1.5} py={2.5} px={1.5} color={"white"} bgColor={"green"} borderRadius={10}>
            <h3>Details</h3>
            <p>
              Right Ascension: {sunData["rightAscension"]} <br />
              Declination: {sunData["declination"]} <br />
              Constellation: {sunData["constellation"]} <br />
              Magnitude: {sunData["magnitude"]} <br />
            </p>
          </MDBox>
        </Grid>
        <Grid item xs={12} md={12} lg={8}>
          <h3>Events</h3>
          <DataTable
            table={{
              columns: [
                { Header: "date", accessor: "date", width: "20%" },
                { Header: "location", accessor: "location", width: "20%" },
                { Header: "notifying factor", accessor: "notfac", width: "20%" },
                { Header: "type", accessor: "type", width: "20%" },
                { Header: "urgancy", accessor: "urgancy", width: "20%" },
              ],
              rows: eventList.reverse(),
            }}
          />
        </Grid>
        <Grid item xs={12} md={12} lg={4}>
          <h3>Neos (TODO)</h3>
          <Card>
            <MDBox p={2}>
              <TimelineItem
                color="success"
                icon="notifications"
                title="$2400, Design changes"
                dateTime="22 DEC 7:20 PM"
              />
              <TimelineItem
                color="error"
                icon="inventory_2"
                title="New order #1832412"
                dateTime="21 DEC 11 PM"
              />
              <TimelineItem
                color="info"
                icon="shopping_cart"
                title="Server payments for April"
                dateTime="21 DEC 9:34 PM"
              />
              <TimelineItem
                color="warning"
                icon="payment"
                title="New card added for order #4395133"
                dateTime="20 DEC 2:20 AM"
              />
              <TimelineItem
                color="primary"
                icon="vpn_key"
                title="New card added for order #4395133"
                dateTime="18 DEC 4:54 AM"
                lastItem
              />
            </MDBox>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default Home;
