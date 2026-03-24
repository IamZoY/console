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

import React, { useState } from "react";
import {
  AddNewTagIcon,
  Button,
  FormLayout,
  Grid,
  InputBox,
  ProgressBar,
} from "mds";
import { api } from "api";
import { errorToHandler } from "api/errors";
import ModalWrapper from "../../Common/ModalWrapper/ModalWrapper";
import {
  configurationIsLoading,
  setErrorSnackMessage,
  setServerNeedsRestart,
  setSnackBarMessage,
} from "../../../../systemSlice";
import { useAppDispatch } from "../../../../store";
import { modalStyleUtils } from "../../Common/FormComponents/common/styleLibrary";

interface AddEventTagModalProps {
  open: boolean;
  onClose: () => void;
}

const AddEventTagModal = ({ open, onClose }: AddEventTagModalProps) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [tagName, setTagName] = useState("EventSent");
  const [tagSuccess, setTagSuccess] = useState("Success");
  const [tagFailed, setTagFailed] = useState("Failed");
  const [eventTypes, setEventTypes] = useState(
    "s3:ObjectCreated:Put,s3:ObjectCreated:Post,s3:ObjectCreated:Copy,s3:ObjectCreated:CompleteMultipartUpload",
  );
  const [invalidInputs, setInvalidInputs] = useState<string[]>(["name"]);
  const [initialInputs, setInitialInputs] = useState<string[]>(["name"]);

  const initializeInput = (field: string) => {
    setInitialInputs(initialInputs.filter((i) => i !== field));
  };

  const validateInput = (field: string, valid: boolean) => {
    if (invalidInputs.includes(field) && valid) {
      setInvalidInputs(invalidInputs.filter((i) => i !== field));
      return;
    }
    if (!valid && !invalidInputs.includes(field)) {
      setInvalidInputs([...invalidInputs, field]);
    }
  };

  const save = () => {
    if (saving || invalidInputs.length !== 0) return;
    if (name.trim() === "") {
      setInvalidInputs([...invalidInputs, "name"]);
      return;
    }

    setSaving(true);

    const payload = {
      key_values: [
        { key: "enable_event_tagging", value: "on" },
        { key: "tag_name", value: tagName },
        { key: "tag_success", value: tagSuccess },
        { key: "tag_failed", value: tagFailed },
        { key: "event_types", value: eventTypes },
      ],
      arn_resource_id: name,
    };

    api.configs
      .setConfig("event_tag", payload)
      .then((res) => {
        setSaving(false);
        dispatch(setServerNeedsRestart(res.data.restart || false));
        if (!res.data.restart) {
          dispatch(setSnackBarMessage("Event tag rule saved successfully"));
        }
        onClose();
        dispatch(configurationIsLoading(true));
      })
      .catch((err) => {
        setSaving(false);
        dispatch(setErrorSnackMessage(errorToHandler(err.error)));
      });
  };

  return (
    <ModalWrapper
      modalOpen={open}
      title="New Event Tag Rule"
      onClose={onClose}
      titleIcon={<AddNewTagIcon />}
    >
      <FormLayout containerPadding={false} withBorders={false}>
        <InputBox
          id="name"
          name="name"
          label="Rule Name"
          value={name}
          required
          pattern="^(?=.*[a-zA-Z0-9]).{1,}$"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            initializeInput("name");
            setName(e.target.value);
            validateInput("name", e.target.validity.valid);
          }}
          error={
            invalidInputs.includes("name") && !initialInputs.includes("name")
              ? "Name is required"
              : ""
          }
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
      </FormLayout>
      {saving && (
        <Grid item xs={12} sx={{ marginBottom: 10 }}>
          <ProgressBar />
        </Grid>
      )}
      <Grid item xs={12} sx={modalStyleUtils.modalButtonBar}>
        <Button
          id="cancel"
          type="button"
          variant="regular"
          disabled={saving}
          onClick={onClose}
          label="Cancel"
          sx={{ marginRight: 10 }}
        />
        <Button
          id="save-event-tag"
          type="submit"
          variant="callAction"
          disabled={saving || invalidInputs.length !== 0}
          label="Save"
          onClick={save}
        />
      </Grid>
    </ModalWrapper>
  );
};

export default AddEventTagModal;
