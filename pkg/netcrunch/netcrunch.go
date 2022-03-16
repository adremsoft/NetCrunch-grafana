package netcrunch

import (
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/netcrunch/config"
	"github.com/grafana/grafana/pkg/netcrunch/defaultDatasource"
	"github.com/grafana/grafana/pkg/netcrunch/fileUtils"
	"github.com/grafana/grafana/pkg/netcrunch/model"
	"github.com/grafana/grafana/pkg/netcrunch/upgrader"
	"github.com/grafana/grafana/pkg/setting"
)

const NETCRUNCH_APP_PLUGIN_ID string = "adremsoft-netcrunch-app"

func CheckInitializationSuccess() (bool, error) {
	return config.CheckInitializationSuccess()
}

func SetInitializationSuccess() bool {
	return config.SetInitializationSuccess()
}

func Init(cfg *setting.Cfg) {
	fileUtils.Init(cfg)
	if config.CreateDefaultStatusesFile() {

		if config.ServerSettingsFileExist() && (!config.VersionFileExist()) {
			iLog := log.New("GrafCrunch initializer")

			if defaultDatasource.AddDefaultNetCrunchDatasource() && config.RemoveServerSettingsFile() &&
				config.WriteVersionFile() {
				iLog.Info("Default NetCrunch datasource has been initialized")
			} else {
				iLog.Info("Initialization error")
			}
		}

		upgrader.Upgrade()
	}

	initNetCrunchPlugin()
}

func initNetCrunchPlugin() {
	model.SetPluginAsCore(NETCRUNCH_APP_PLUGIN_ID)

	if orgs, found := model.GetOrgs(); found {
		model.EnablePluginForOrgs(orgs, NETCRUNCH_APP_PLUGIN_ID)
	}
}
