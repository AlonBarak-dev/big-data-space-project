import MDBox from "components/MDBox";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import PropTypes from "prop-types";

const EventsDistBarPlot = ({ dataSourceUrl, title, description, color }) => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(dataSourceUrl);
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

  console.log(jsonData);
  const barPlotData = convertFormat(jsonData);
  console.log(barPlotData);

  return (
    <MDBox mt={3}>
      <ReportsBarChart
        color={color}
        title={title}
        description={description}
        chart={barPlotData}
        date=""
      />
    </MDBox>
  );
};

EventsDistBarPlot.propTypes = {
  dataSourceUrl: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

function convertFormat(plotData) {
  const labels = [];
  const values = [];
  for (let key in plotData) {
    labels.push(key);
    values.push(plotData[key]);
  }

  return {
    labels: labels,
    datasets: { label: "Event Count", data: values },
  };
}

export default EventsDistBarPlot;
