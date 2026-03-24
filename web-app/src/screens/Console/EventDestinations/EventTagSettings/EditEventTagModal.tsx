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

import React, { Fragment, useEffect, useState } from "react";
import {
  AddNewTagIcon,
  Button,
  FormLayout,
  Grid,
  InputBox,
  ProgressBar,
  Switch,
} from "mds";
import ModalWrapper from "../../Common/ModalWrapper/ModalWrapper";
import { modalStyleUtils } from "../../Common/FormComponents/common/styleLibrary";
import {
  configurationIsLoading,
  setErrorSnackMessage,
  setServerNeedsRestart,
  setSnackBarMessage,
} from "../../../../systemSlice";
import { useAppDispatch } from "../../../../store";
import { IConfigurationSys } from "../../Configurations/types";
import { api } from "api";
import { errorToHandler } from "api/errors";

interface EditEventTagModalProps {
  open: boolean;
  endpointInfo: IConfigurationSys;
  onClose: () => void;
}

const EditEventTagModal = ({
  open,
  endpointInfo,
  onClose,
}: EditEventTagModalProps) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState("on");
  const [tagName, setTagName] = useState("EventSent");
  const [tagSuccess, setTagSuccess] = useState("Success");
  const [tagFailed, setTagFailed] = useState("Failed");
  const [eventTypes, setEventTypes] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (endpointInfo) {
      setName(endpointInfo.name || "");
      for (const kv of endpointInfo.key_values) {
        const val = kv.env_override?.value ?? kv.value;
        switch (kv.key) {
          case "enable_event_tagging":
            setEnabled(val === "" || val === "on" ? "on" : "off");
            break;
          case "tag_name":
            if (val) setTagName(val);
            break;
          case "tag_success":
            if (val) setTagSuccess(val);
            break;
          case "tag_failed":
            if (val) setTagFailed(val);
            break;
          case "event_types":
            if (val) setEventTypes(val);
            break;
        }
      }
    }
  }, [endpointInfo]);

  const save = () => {
    if (saving) return;
    setSaving(true);

    const payload = {
      key_values: [
        { key: "enable_event_tagging", value: enabled },
        { key: "tag_name", value: tagName },
        { key: "tag_success", value: tagSuccess },
        { key: "tag_failed", value: tagFailed },
        { key: "event_types", value: eventTypes },
      ],
    };

    api.configs
      .setConfig(name, payload)
      .then((res) => {
        setSaving(false);
        dispatch(setServerNeedsRestart(res.data.restart || false));
        if (!res.data.restart) {
          dispatch(setSnackBarMessage("Event tag rule updated successfully"));
        }
        onClose();
        dispatch(configurationIsLoading(true));
      })
      .catch((err) => {
        setSaving(false);
        dispatch(setErrorSnackMessage(errorToHandler(err.error)));
      });
  };

  const defaultEntry = !name.includes(":");
  const hasOverride = endpointInfo.key_values.some((kv) => !!kv.env_override);

  return (
    <Fragment>
      <ModalWrapper
        modalOpen={open}
        title={`Edit ${defaultEntry ? "Default " : ""}Event Tag Rule${defaultEntry ? "" : ` - ${name}`}`}
        onClose={onClose}
        titleIcon={<AddNewTagIcon />}
      >
        <FormLayout withBorders={false} containerPadding={false}>
          {hasOverride ? (
            <Fragment>
              <p>
                This tag rule is configured via environment variables and cannot
                be edited from the console.
              </p>
            </Fragment>
          ) : (
            <Fragment>
              <Switch
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEnabled(e.target.checked ? "on" : "off")
                }
                id="enabled"
                name="enabled"
                label="Enabled"
                value="switch_on"
                checked={enabled === "on"}
              />
              <InputBox
                id="tag_name"
                name="tag_name"
                label="Tag Key"
                tooltip="The tag key applied to objects (e.g. EventSentToDiode)"
                value={tagName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagName(e.target.value)
                }
              />
              <InputBox
                id="tag_success"
                name="tag_success"
                label="Success Value"
                tooltip="Tag value when event is delivered successfully"
                value={tagSuccess}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagSuccess(e.target.value)
                }
              />
              <InputBox
                id="tag_failed"
                name="tag_failed"
                label="Failed Value"
                tooltip="Tag value when event delivery fails"
                value={tagFailed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagFailed(e.target.value)
                }
              />
              <InputBox
                id="event_types"
                name="event_types"
                label="Event Types"
                tooltip="Comma-separated S3 event types that trigger this tag rule"
                value={eventTypes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEventTypes(e.target.value)
                }
              />
              {saving && (
                <Grid item xs={12} sx={{ marginBottom: 10 }}>
                  <ProgressBar />
                </Grid>
              )}
              <Grid item sx={modalStyleUtils.modalButtonBar}>
                <Button
                  id="cancel"
                  type="button"
                  variant="regular"
                  disabled={saving}
                  onClick={onClose}
                  label="Cancel"
                />
                <Button
                  id="save-event-tag"
                  type="submit"
                  variant="callAction"
                  disabled={saving}
                  label="Update"
                  onClick={save}
                />
              </Grid>
            </Fragment>
          )}
        </FormLayout>
      </ModalWrapper>
    </Fragment>
  );
};

export default EditEventTagModal;
