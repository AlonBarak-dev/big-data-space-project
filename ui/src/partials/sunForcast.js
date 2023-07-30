import { useState, useEffect } from "react";

import Skeleton from "react-loading-skeleton";
import { Card, Grid } from "@mui/material";

import MDBox from "../components/MDBox";
import { json } from "react-router-dom";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";

const SunForcastPartial = () => {
  const [sunspotImageData, setSunspotImageData] = useState(null);
  const [sunActivity, setSunActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sunspotImageResponse = await fetch("/get_sun_image");
        const sunActivityResponse = await fetch("/get_solar_flares/2");

        const sunspotImage = await sunspotImageResponse.json();
        const sunActivity = await sunActivityResponse.json();

        setSunspotImageData(sunspotImage.image.value);
        setSunActivity(sunActivity.solar);

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

  const preparedSunActivityData = convertSunActivityFormat(sunActivity);
  console.log("Sun Activity: ", preparedSunActivityData);
  console.log("Sunspot image data: ", sunspotImageData);
  return (
    <MDBox mt={3}>
      <Grid container spacing={3}>
        <Grid item>
          <h2>Current Sun State</h2>
          <img src={`data:image/jpeg;base64,${sunspotImageData}`} alt="Sunspot Image" />
        </Grid>
        <Grid item mt={8} lg={4}>
          <ReportsLineChart
            color="info"
            title="Sun Activity"
            description="Sun activity in the last 2 Hours"
            chart={preparedSunActivityData}
            date=""
          />
        </Grid>
      </Grid>
    </MDBox>
  );
};

function convertSunActivityFormat(sunActivity) {
  const values = [];
  const labels = [];
  for (let idx in sunActivity) {
    labels.push(formatMillisecondsToHoursMinutes(sunActivity[idx]["date"]));
    values.push(sunActivity[idx]["value"]);
  }

  return {
    labels: labels,
    datasets: { label: "Sun Activity", data: values },
  };
}

function formatMillisecondsToHoursMinutes(milliseconds) {
  const date = new Date(milliseconds);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default SunForcastPartial;
