import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";

import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";
import DataTable from "../examples/Tables/DataTable";

import {
  Autocomplete,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import MDButton from "../components/MDButton";
import MDBox from "components/MDBox";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const Search = () => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [api_request_url, setApiUrl] = useState("/get_event_list");

  const currentDate = new Date();
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [typeValue, setTypeValue] = useState(null);
  const [searchBy, setSearchBy] = useState("none");

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

    const url = getUrlByFilters(formatDate(startDate), formatDate(endDate), searchBy, typeValue);
    console.log("Calling URL: ", url);
    setApiUrl(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton />
      </DashboardLayout>
    );
  }

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
  var eventList = jsonData["events"];
  console.log("Event list: ", eventList);
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} lg={2}>
          <DatePicker
            label="Start Date"
            onChange={(date) => {
              setStartDate(date);
            }}
          />
        </Grid>
        <Grid item xs={12} md={3} lg={2}>
          <DatePicker
            label="End Date"
            onChange={(date) => {
              setEndDate(date);
            }}
          />
        </Grid>
        <Grid item xs={12} md={2} lg={2}>
          <FormControl fullWidth>
            <InputLabel id="test-select-label">Search By</InputLabel>
            <Select
              value={searchBy}
              onChange={(type) => {
                setSearchBy(type.target.value);
              }}
              fullWidth
              label="Search By"
              style={{ height: "42px", fontSize: "16px" }} // Adjust the height and font size as needed
            >
              <MenuItem value={"none"}>None</MenuItem>
              <MenuItem value={"star"}>Star</MenuItem>
              <MenuItem value={"type"}>Type</MenuItem>
              <MenuItem value={"notfac"}>Notifying Factor </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {!["none", "star"].includes(searchBy) ? (
          <Grid item xs={12} md={2} lg={2}>
            <FormControl fullWidth>
              <InputLabel id="test-select-label">Value</InputLabel>
              <Select
                value={typeValue}
                onChange={(value) => {
                  setTypeValue(value.target.value);
                }}
                fullWidth
                label="Value"
                style={{ height: "42px", fontSize: "16px" }}
              >
                {starList.map((element) => {
                  return (
                    <MenuItem key={element} value={element}>
                      {element}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
        ) : searchBy === "star" ? (
          <Grid item xs={12} md={2} lg={2}>
            <Autocomplete
              id="combo-box-demo"
              options={getElementsBasedOnSearchType(searchBy)}
              renderInput={(params) => <TextField {...params} label="Star Name" />}
              onChange={(value) => {
                setTypeValue(value.target.value);
              }}
            />
          </Grid>
        ) : (
          <div></div>
        )}
        <Grid item xs={12} md={2} lg={4}>
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
                  { Header: "star", accessor: "star", width: "10%" },
                  { Header: "date", accessor: "date", width: "10%" },
                  { Header: "location", accessor: "location", width: "10%" },
                  { Header: "notifying factor", accessor: "notfac", width: "10%" },
                  { Header: "type", accessor: "type", width: "10%" },
                  { Header: "urgency", accessor: "urg", width: "10%" },
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

function getUrlByFilters(startDate, endDate, searchType, typeValue) {
  if (searchType === "type") {
    return `/get_event_list_date_by_type/${startDate}/${endDate}/${typeValue}`;
  } else if (searchType === "notfac") {
    return `/get_event_list_date_by_notfac/${startDate}/${endDate}/${typeValue}`;
  } else if (searchType === "star") {
    return `/get_event_list_date_by_star/${startDate}/${endDate}/${typeValue}`;
  } else if (startDate < endDate) {
    return `/get_event_list_date/${startDate}/${endDate}`;
  } else {
    return "/get_event_list";
  }
}

function getElementsBasedOnSearchType(searchType) {
  if (searchType === "type") {
    return ["X Ray Rise", "Comet", "GRB", "UV Rise", "Apparent Brightness Rise"];
  } else if (searchType === "notfac") {
    return [
      "MMT",
      "Gemini",
      "Very Large",
      "Subaru",
      "Large Binocular",
      "Southern African",
      "Keck 1 and 2",
      "Hobby-Eberly",
      "Gran canarias",
      "THe Giant Magellan",
      "Thirty Meter",
      "European Extremly Large",
    ];
  } else {
    return [];
  }
}

async function getStarList() {
  const response = await fetch("/get_star_list");
  const jsonData = await response.json();
  return jsonData.stars;
}

export default Search;
