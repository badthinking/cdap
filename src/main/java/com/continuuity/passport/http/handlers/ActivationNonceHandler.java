/*
 * Copyright 2012-2013 Continuuity,Inc. All Rights Reserved.
 */

package com.continuuity.passport.http.handlers;


import com.continuuity.passport.core.exceptions.StaleNonceException;
import com.continuuity.passport.core.service.DataManagementService;
import com.continuuity.passport.meta.Account;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.inject.Inject;
import com.google.inject.Singleton;

import javax.ws.rs.*;
import javax.ws.rs.core.Response;

/**
 * Defines end points for Account activation based nonce
 */
@Path("/passport/v1")
@Singleton
public class ActivationNonceHandler extends PassportHandler {

  private final DataManagementService dataManagementService;

  @Inject
  public ActivationNonceHandler(DataManagementService dataManagementService) {
    this.dataManagementService = dataManagementService;
  }

  @GET
  @Produces("text/plain")
  public Response status(){
    return Response.ok("OK").build();
  }

  @Path("generateActivationKey/{id}")
  @GET
  @Produces("application/json")
  public Response getActivationNonce(@PathParam("id") String id) {
    requestReceived();
    int nonce = -1;
    try {
      nonce = dataManagementService.getActivationNonce(id);
      if (nonce != -1) {
        requestSuccess();
        return Response.ok(Utils.getNonceJson(null, nonce)).build();
      } else {
        requestFailed();
        return Response.status(javax.ws.rs.core.Response.Status.NOT_FOUND)
          .entity(Utils.getNonceJson("Couldn't generate nonce", nonce))
          .build();
      }
    } catch (RuntimeException e) {
      requestFailed();
      return Response.status(javax.ws.rs.core.Response.Status.NOT_FOUND)
        .entity(Utils.getNonceJson("Couldn't generate nonce", nonce))
        .build();
    }
  }

  @Path("getActivationId/{nonce}")
  @GET
  @Produces("application/json")
  public Response getActivationId(@PathParam("id") int nonce) {
    requestReceived();
    String id = null;
    try {
      id = dataManagementService.getActivationId(nonce);
      if (id != null && !id.isEmpty()) {
        requestSuccess();
        return Response.ok(Utils.getIdJson(null, id)).build();
      } else {
        requestFailed();
        return Response.status(javax.ws.rs.core.Response.Status.NOT_FOUND)
          .entity(Utils.getIdJson("ID not found for nonce", id))
          .build();
      }
    } catch (StaleNonceException e) {
      requestFailed();
      return Response.status(javax.ws.rs.core.Response.Status.NOT_FOUND)
        .entity(Utils.getIdJson("ID not found for nonce", id))
        .build();
    }
  }

  @Path("generateResetKey/{email_id}")
  @GET
  @Produces("application/json")
  public Response getRegenerateResetKey(@PathParam("email_id") String emailId) {
    requestReceived();
    int nonce = -1;
    try {
      nonce = dataManagementService.getResetNonce(emailId);
      if (nonce != -1) {
        requestSuccess();
        return Response.ok(Utils.getNonceJson(null, nonce)).build();
      } else {
        requestFailed();
        return Response.status(javax.ws.rs.core.Response.Status.NOT_FOUND)
          .entity(Utils.getNonceJson("Couldn't generate resetKey", nonce))
          .build();
      }
    } catch (RuntimeException e) {
      requestFailed();
      return Response.status(javax.ws.rs.core.Response.Status.NOT_FOUND)
        .entity(Utils.getJsonError(String.format("Couldn't generate resetKey for %s", emailId)))
        .build();
    }
  }

  @Path("resetPassword/{nonce}")
  @POST
  @Produces("application/json")
  @Consumes("application/json")
  public Response resetPassword(@PathParam("nonce") int nonce, String data) {
    requestReceived();
    Gson gson = new Gson();
    JsonObject jObject = gson.fromJson(data, JsonElement.class).getAsJsonObject();
    String password = jObject.get("password") == null ? null : jObject.get("password").getAsString();

    if (password != null) {
      try {
        Account account = dataManagementService.resetPassword(nonce, password);
        requestSuccess();
        return Response.ok(account.toString()).build();
      } catch (Exception e) {
        requestFailed(); // Request failed
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
          .entity(Utils.getJson("FAILED", "Failed to get reset the password"))
          .build();
      }
    } else {
      requestFailed(); // Request failed
      return Response.status(Response.Status.BAD_REQUEST)
        .entity(Utils.getJson("FAILED", "Must pass in password"))
        .build();
    }
  }

}
