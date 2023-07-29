import { useState, useEffect } from "react";

import Skeleton from "react-loading-skeleton";
import { Card } from "@mui/material";

import MDBox from "../components/MDBox";

const SunForcastPartial = () => {
  const [sunData, setSunData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  if (!sunData) {
    return (
      <Card>
        <p>failed to get sun forcast</p>
      </Card>
    );
  }

  if (loading) {
    return <Skeleton />;
  }

  return (
    <MDBox mb={1.5} py={2.5} px={1.5} color={"white"} bgColor={"green"} borderRadius={10}>
      <h3>Details</h3>
      {sunData ? (
        <p>
          Right Ascension: {sunData["rightAscension"]} <br />
          Declination: {sunData["declination"]} <br />
          Constellation: {sunData["constellation"]} <br />
          Magnitude: {sunData["magnitude"]} <br />
        </p>
      ) : (
        <p>Failed to get sun Details</p>
      )}
    </MDBox>
  );
};

export default SunForcastPartial;
