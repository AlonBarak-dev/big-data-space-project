import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import DataTable from "../examples/Tables/DataTable";
import MDInput from "../components/MDInput";

import { Card, Grid } from "@mui/material";
import MDButton from "../components/MDButton";
import MDBox from "components/MDBox";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const Search = () => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [api_request_url, setApiUrl] = useState("get_event_list");

  const currentDate = new Date();
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Updating events...");
        const response = await fetch(api_request_url);
        const data = await response.json();
        setJsonData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error retrieving JSON data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [api_request_url]);

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevents the default form submission behavior
    console.log("Start date: ", startDate);
    console.log("End date: ", endDate);
    console.log("start < end: ", startDate < endDate);
    if (inputValue.length == 0) {
      setApiUrl("get_event_list");
    }
    if (startDate < endDate) {
      const urlPath = `/get_event_list_date/${formatDate(startDate)}/${formatDate(endDate)}`;
      setApiUrl(urlPath);
      console.log("Search url: ", api_request_url);
    } else {
      console.log("Searching: ", inputValue);
      setApiUrl("get_event_list?query=" + inputValue);
    }
    // Reset the form input
    setInputValue("");
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  if (!jsonData) {
    return (
      <DashboardLayout>
        <Card>
          <MDBox px={3} py={3}>
            <p>Failed to load events</p>
          </MDBox>
        </Card>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton />
      </DashboardLayout>
    );
  }

  var eventList = jsonData["events"];
  console.log("Event list: ", eventList);
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={2}>
          <MDInput
            label="Full text search"
            value={inputValue}
            onChange={handleInputChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <DatePicker
            label="Start Date"
            onChange={(date) => {
              setStartDate(date);
            }}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <DatePicker
            label="End Date"
            onChange={(date) => {
              setEndDate(date);
            }}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <form onSubmit={handleSubmit}>
            <MDButton color="info" type={"submit"}>
              Search
            </MDButton>
          </form>
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          {eventList ? (
            <DataTable
              table={{
                columns: [
                  { Header: "date", accessor: "date", width: "20%" },
                  { Header: "location", accessor: "location", width: "20%" },
                  { Header: "notifying factor", accessor: "notfac", width: "20%" },
                  { Header: "type", accessor: "type", width: "20%" },
                  { Header: "urgency", accessor: "urg", width: "20%" },
                ],
                rows: eventList.reverse(),
              }}
            />
          ) : (
            <Card>
              <p>No events</p>
            </Card>
          )}
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

function formatDate(date) {
  date = new Date(date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default Search;
