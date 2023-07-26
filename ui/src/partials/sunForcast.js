import { useState, useEffect } from "react";

import Skeleton from "react-loading-skeleton";

import MDBox from "../components/MDBox";
import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";

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

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton />
      </DashboardLayout>
    );
  }

  return (
    <div>
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
    </div>
  );
};

export default SunForcastPartial;
