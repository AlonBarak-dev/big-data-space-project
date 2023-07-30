import React, { useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Card, Grid } from "@mui/material";
import CachedIcon from "@mui/icons-material/Cached";

import MDBox from "../components/MDBox";
import DashboardLayout from "../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../examples/Navbars/DashboardNavbar";

import NeoList from "partials/neolist";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import DataTable from "../examples/Tables/DataTable";
import MDButton from "../components/MDButton";
import dayjs from "dayjs";

const AnalyticsPage = () => {
  const API_BASE = "http://35.234.119.103:4444/";

  const [api_request_url, setApiUrl] = useState(API_BASE);

  const [loading, setLoading] = useState(false);

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 1);
  const toDate = new Date();

  const [startDate, setStartDate] = useState(fromDate);
  const [endDate, setEndDate] = useState(toDate);
  const [loadedData, setLoadedData] = useState({
    associations: { rules: [] },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Updating events...");
      fromDate.setUTCHours(0, 0, 0, 0);
      toDate.setUTCHours(0, 0, 0, 0);
      const response = await fetch(
        api_request_url + `?from=${startDate.toISOString()}&to=${endDate.toISOString()}`
      );
      const data = await response.json();
      setLoadedData(data);
    } catch (error) {
      console.error("Error retrieving JSON data:", error);
    }
    setLoading(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevents the default form submission behavior
    // const url = getUrlByFilters(formatDate(startDate), formatDate(endDate), searchBy, typeValue);
    // console.log("Calling URL: ", url);
    fetchData();
  };

  useEffect(() => {});

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} lg={2}>
          <DatePicker
            label="Start Date"
            defaultValue={dayjs(fromDate)}
            onChange={(date) => {
              setStartDate(date);
            }}
          />
        </Grid>
        <Grid item xs={12} md={3} lg={2}>
          <DatePicker
            label="End Date"
            defaultValue={dayjs(toDate)}
            onChange={(date) => {
              setEndDate(date);
            }}
          />
        </Grid>

        <Grid item xs={12} md={3} lg={2}>
          <form onSubmit={handleSubmit}>
            <MDButton disabled={loading ? "true" : undefined} color="info" type={"submit"}>
              Search{" "}
              {loading ? (
                <CachedIcon
                  sx={{
                    animation: "spin 2s linear infinite",
                    "@keyframes spin": {
                      "0%": {
                        transform: "rotate(360deg)",
                      },
                      "100%": {
                        transform: "rotate(0deg)",
                      },
                    },
                  }}
                ></CachedIcon>
              ) : undefined}
            </MDButton>
          </form>
        </Grid>

        <Grid item xs={12} md={12} lg={12}>
          {loadedData.associations.rules ? (
            <DataTable
              table={{
                columns: [
                  { Header: "LHS", accessor: "lhs_desc", width: "10%" },
                  { Header: "RHS", accessor: "rhs_desc", width: "10%" },
                  { Header: "Confidence", accessor: "confidence", width: "10%" },
                  { Header: "Leverage", accessor: "leverage", width: "10%" },

                  { Header: "Lift", accessor: "lift", width: "10%" },
                  { Header: "Support", accessor: "support", width: "10%" },
                ],
                rows: loadedData.associations.rules,
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

export default AnalyticsPage;
