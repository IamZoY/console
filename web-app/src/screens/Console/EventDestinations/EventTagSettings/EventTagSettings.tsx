// This file is part of MinIO Console Server
// Copyright (c) 2024 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { Fragment, useState } from "react";
import { IConfigurationSys, IElementValue } from "../../Configurations/types";
import { Button, DataTable, Grid, TierOfflineIcon, TierOnlineIcon } from "mds";
import AddEventTagModal from "./AddEventTagModal";
import EditEventTagModal from "./EditEventTagModal";
import DeleteWebhookEndpoint from "../WebhookSettings/DeleteWebhookEndpoint";
import { Configuration } from "api/consoleApi";

interface EventTagSettingsProps {
  eventTagList: Configuration[];
  setResetConfigurationOpen: () => void;
}

const EventTagSettings = ({
  setResetConfigurationOpen,
  eventTagList,
}: EventTagSettingsProps) => {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedARN, setSelectedARN] = useState("");
  const [selectedItem, setSelectedItem] = useState<IConfigurationSys | null>(
    null,
  );

  const getKVValue = (kvs: IElementValue[], key: string): string => {
    const found = kvs.find((kv) => kv.key === key);
    if (found?.env_override) return found.env_override.value || "";
    return found?.value || "";
  };

  const renderStatus = (item: IElementValue[]) => {
    const enable = item.find((kv) => kv.key === "enable_event_tagging");
    const isOn =
      !enable || enable.value === "on" || enable.value === "" ? true : false;
    if (enable?.env_override) {
      const envOn =
        !enable.env_override.value || enable.env_override.value === "on";
      return (
        <Grid
          container
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "8px",
          }}
        >
          {envOn ? (
            <TierOnlineIcon
              style={{ fill: "#4CCB92", width: 14, height: 14 }}
            />
          ) : (
            <TierOfflineIcon
              style={{ fill: "#C83B51", width: 14, height: 14 }}
            />
          )}
          {envOn ? "Enabled" : "Disabled"}
        </Grid>
      );
    }
    return (
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: "8px",
        }}
      >
        {isOn ? (
          <TierOnlineIcon style={{ fill: "#4CCB92", width: 14, height: 14 }} />
        ) : (
          <TierOfflineIcon style={{ fill: "#C83B51", width: 14, height: 14 }} />
        )}
        {isOn ? "Enabled" : "Disabled"}
      </Grid>
    );
  };

  const renderTagName = (item: IElementValue[]) =>
    getKVValue(item, "tag_name") || "EventSent";
  const renderTagSuccess = (item: IElementValue[]) =>
    getKVValue(item, "tag_success") || "Success";
  const renderTagFailed = (item: IElementValue[]) =>
    getKVValue(item, "tag_failed") || "Failed";

  const actions = [
    {
      type: "view" as const,
      onClick: (item: IConfigurationSys) => {
        if (item.name) {
          setEditOpen(true);
          setSelectedItem(item);
        }
      },
    },
    {
      type: "delete" as const,
      onClick: (item: IConfigurationSys) => {
        if (item.name) {
          setDeleteOpen(true);
          setSelectedARN(item.name);
        }
      },
      disableButtonFunction: (item: string) => {
        const entry = eventTagList.find((e) => e.name === item);
        if (entry) {
          const hasOverride = entry.key_values?.filter(
            (kv) => !!kv.env_override,
          );
          if (hasOverride && hasOverride.length > 0) return true;
        }
        return false;
      },
    },
  ];

  return (
    <Grid container>
      {addOpen && (
        <AddEventTagModal open={addOpen} onClose={() => setAddOpen(false)} />
      )}
      {deleteOpen && (
        <DeleteWebhookEndpoint
          modalOpen={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setSelectedARN("");
          }}
          selectedARN={selectedARN}
          type="event_tag"
        />
      )}
      {editOpen && selectedItem && (
        <EditEventTagModal
          open={editOpen}
          endpointInfo={selectedItem}
          onClose={() => {
            setEditOpen(false);
            setSelectedItem(null);
          }}
        />
      )}
      <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          id="newEventTag"
          variant="callAction"
          onClick={() => setAddOpen(true)}
        >
          New Tag Rule
        </Button>
      </Grid>
      <Grid item xs={12} sx={{ padding: "0 10px 10px" }}>
        <Fragment>
          <h3>Configured Event Tag Rules</h3>
          <DataTable
            columns={[
              {
                label: "Status",
                elementKey: "key_values",
                renderFunction: renderStatus,
                width: 50,
              },
              { label: "Name", elementKey: "name" },
              {
                label: "Tag Key",
                elementKey: "key_values",
                renderFunction: renderTagName,
              },
              {
                label: "Success Value",
                elementKey: "key_values",
                renderFunction: renderTagSuccess,
              },
              {
                label: "Failed Value",
                elementKey: "key_values",
                renderFunction: renderTagFailed,
              },
            ]}
            itemActions={actions}
            idField="name"
            isLoading={false}
            records={eventTagList}
            entityName="tag rules"
            customPaperHeight="calc(100vh - 750px)"
          />
        </Fragment>
      </Grid>
    </Grid>
  );
};

export default EventTagSettings;
