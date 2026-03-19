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

package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/IamZoY/console/models"
	"github.com/IamZoY/console/pkg/auth"
	"github.com/minio/madmin-go/v3"
)

// TagIndexRebuildMiddleware intercepts requests to the tag index rebuild endpoint
// and proxies them to the MinIO admin API.
func TagIndexRebuildMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		const prefix = "/api/v1/admin/tag-index/rebuild/"

		if r.Method == http.MethodPost && strings.HasPrefix(r.URL.Path, prefix) {
			bucket := strings.TrimPrefix(r.URL.Path, prefix)
			bucket = strings.TrimSuffix(bucket, "/")

			if bucket == "" {
				http.Error(w, `{"message":"bucket name is required"}`, http.StatusBadRequest)
				return
			}

			handleRebuildTagIndex(w, r, bucket)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func handleRebuildTagIndex(w http.ResponseWriter, r *http.Request, bucket string) {
	token, err := auth.GetTokenFromRequest(r)
	if err != nil {
		http.Error(w, `{"message":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	sessionToken, err := auth.DecryptToken(token)
	if err != nil {
		http.Error(w, `{"message":"invalid session"}`, http.StatusUnauthorized)
		return
	}

	claims, err := auth.ParseClaimsFromToken(string(sessionToken))
	if err != nil {
		http.Error(w, `{"message":"invalid claims"}`, http.StatusUnauthorized)
		return
	}

	session := &models.Principal{
		STSAccessKeyID:     claims.STSAccessKeyID,
		STSSecretAccessKey: claims.STSSecretAccessKey,
		STSSessionToken:    claims.STSSessionToken,
		AccountAccessKey:   claims.AccountAccessKey,
	}

	mAdmin, err := NewMinioAdminClient(r.Context(), session)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, fmt.Sprintf("failed to create admin client: %v", err))
		return
	}

	// Call the MinIO admin API to rebuild the tag index
	qv := url.Values{}
	qv.Set("bucket", bucket)
	resp, err := mAdmin.ExecuteMethod(r.Context(), http.MethodPost, madmin.RequestData{
		RelPath:     "/v3/rebuild-tag-index",
		QueryValues: qv,
	})
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, fmt.Sprintf("failed to rebuild tag index: %v", err))
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, fmt.Sprintf("failed to read response: %v", err))
		return
	}

	if resp.StatusCode != http.StatusOK {
		writeJSONError(w, resp.StatusCode, string(body))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

func writeJSONError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	resp := map[string]string{"message": message}
	json.NewEncoder(w).Encode(resp)
}
