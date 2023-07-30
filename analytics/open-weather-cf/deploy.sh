 gcloud functions delete --project big-data-project-391910 --region=europe-west3 open-weather-scrape-function  --gen2 --quiet

 gcloud functions deploy open-weather-scrape-function \
  --gen2 \
  --max-instances=3 \
  --runtime=nodejs16 \
  --region=europe-west3 \
  --source=. \
  --entry-point=ow_scraper \
  --trigger-http \
  --allow-unauthenticated \
  --project big-data-project-391910
