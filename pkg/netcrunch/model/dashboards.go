package model

import (
//   "github.com/grafana/grafana/pkg/bus"
  "github.com/grafana/grafana/pkg/models"
)

type DashboardProcessor func(dashboard *models.Dashboard)

func getDashboards() ([]*models.Dashboard, bool) {
// TODO: getDashboards
//   query := models.GetAllDashboardsQuery {}
//   err := bus.Dispatch(&query)
//
//   return query.Result, (err == nil)
  return nil, false
}

func UpdateDashboard(dashboard *models.Dashboard) (bool) {
// TODO: getDashboards

//   updateCommand := models.UpdateDashboardCommand {
//     Dashboard: dashboard,
//   }
//
//   err := bus.Dispatch(&updateCommand)
//   return (err == nil)
	return false
}

func ProcessDashboards(dashboardProcessor DashboardProcessor) {
  dashboards, dashboardsFound := getDashboards()
  if dashboardsFound {
    for dashboardIndex := range dashboards {
      dashboardProcessor(dashboards[dashboardIndex])
    }
  }
}
