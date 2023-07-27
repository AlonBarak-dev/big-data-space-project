import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import DataTable from "../examples/Tables/DataTable";
import MDInput from "../components/MDInput";

import { Grid } from "@mui/material";
import MDButton from "../components/MDButton";

const Search = () => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [api_request_url, setApiUrl] = useState("get_event_list");

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

    if (inputValue.length == 0) {
      setApiUrl("get_event_list");
      return;
    }
    console.log("Searching: ", inputValue);
    setApiUrl("get_event_list?query=" + inputValue);

    // Reset the form input
    setInputValue("");
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton />
      </DashboardLayout>
    );
  }

  var eventList = jsonData["events"];
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={6}>
          <MDInput
            label="Search Events"
            value={inputValue}
            onChange={handleInputChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6} lg={6}>
          <form onSubmit={handleSubmit}>
            <MDButton color="info" type={"submit"}>
              Search
            </MDButton>
          </form>
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
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
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default Search;
