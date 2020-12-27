/**
 * Copyright 2019-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

"use strict";

const Curation = require("./curation"),
  Order = require("./order"),
  Response = require("./response"),
  Care = require("./care"),
  Survey = require("./survey"),
  GraphAPi = require("./graph-api"),
  config = require("./config"),
  i18n = require("../i18n.config");
  
module.exports = class Receive {
  constructor(user, webhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  // Check if the event is a message or postback and
  // call the appropriate handler function
  handleMessage() {
    let event = this.webhookEvent;

    let responses;

    try {
      if (event.message) {
        let message = event.message;

        if (message.quick_reply) {
          responses = this.handleQuickReply();
        } else if (message.attachments) {
          responses = this.handleAttachmentMessage();
        } else if (message.text) {
          responses = this.handleTextMessage();
        }
      } else if (event.postback) {
        responses = this.handlePostback();
      } else if (event.referral) {
        responses = this.handleReferral();
      }
    } catch (error) {
      console.error(error);
      responses = {
        text: `An error has occured: '${error}'. We have been notified and \
        will fix the issue shortly!`
      };
    }

    if (Array.isArray(responses)) {
      let delay = 0;
      for (let response of responses) {
        this.sendMessage(response, delay * 2000);
        delay++;
      }
    } else {
      this.sendMessage(responses);
    }
  }

  // Handles messages events with text
  handleTextMessage() {
    console.log(
      "Received text:",
      `${this.webhookEvent.message.text} for ${this.user.psid}`
    );

    // check greeting is here and is confident
    let greeting = this.firstEntity(this.webhookEvent.message.nlp, "greetings");

    let message = this.webhookEvent.message.text.trim().toLowerCase();

    let response;

    if (
      (greeting && greeting.confidence > 0.8) ||
      message.includes("start over")
    ) {
      response = Response.genNuxMessage(this.user);
    }
    // هون انا جربت اعمل keyword من خلال استخدام التعديل التالي
    else if (message.includes("محمد")) {
      response = [
        Response.genText(
          i18n.__("nayef.mohammad")
        ),
        Response.genImageTemplate(
          `https://z-p3-scontent.famm3-2.fna.fbcdn.net/v/t39.2365-6/23065701_1942345712696886_5686788878908784640_n.png?_nc_cat=100&ccb=2&_nc_sid=ad8a9d&_nc_eui2=AeFPJUV60zfYvmC_ub54PuF5eSBFuMIY0aZ5IEW4whjRprY8RyJYX56U7peySkeO2Jyh1rFMX8aN1S5Mupb_CGZn&_nc_ohc=NQGG_GuQqJoAX9EUWjq&_nc_ht=z-p3-scontent.famm3-2.fna&oh=2707b8aa89d10f5b58edd2ba8b8600e8&oe=6000145F`,
          i18n.__("nayef.thank"),
          i18n.__("nayef.thank")
        ),

        Response.genmediaTemplate(
          "image",`https://business.facebook.com/botqurankareem/photos/a.1770700349894851/2019309301700620`
          
        ),

        Response.genmediaTemplate(
          "video",`https://business.facebook.com/botqurankareem/videos/290337575284824`
      
        ),
      
        Response.genimageTemplate(
        `https://z-p3-scontent.famm3-1.fna.fbcdn.net/v/t1.0-9/p960x960/48384173_2019309308367286_6808321504091045888_o.jpg?_nc_cat=110&ccb=2&_nc_sid=85a577&_nc_eui2=AeElHb_sOU2pB0C_SOhGRfAVKQ-JOQH9O7MpD4k5Af07s2Ahqm5Bh0MwoMCp5HXq7nVkXcI02At6nI8j8zXj-jht&_nc_ohc=4PWPw2xKY4wAX_UbApV&_nc_ht=z-p3-scontent.famm3-1.fna&tp=6&oh=080c6d972892ee64f774092397c296f0&oe=5FFDEC30`

        ),

        Response.genvideoTemplate(
          `https://manybot-files.s3.eu-central-1.amazonaws.com/fb1770590939905792/ca/2018/10/16/8287ab77f9391176acf0d251a814469c.mp4`
  
          ),

        Response.genQuickReply(i18n.__("nayef.mohammad"), [
          {
            title: i18n.__("nayef.thank"),
            payload: "CURATION"
          },
          {
            title: i18n.__("nayef.thank"),
            payload: "CARE_HELP"
          },
          {
            title: i18n.__("nayef.thank"),
            payload: "CARE_HELP"
          }
        ])
      ];

    }
    // هون انتهى التعديل
    else if (Number(message)) {
      response = Order.handlePayload("ORDER_NUMBER");
    } else if (message.includes("#")) {
      response = Survey.handlePayload("CSAT_SUGGESTION");
    } else if (message.includes(i18n.__("care.help").toLowerCase())) {
      let care = new Care(this.user, this.webhookEvent);
      response = care.handlePayload("CARE_HELP");
    } else {
      response = [
        Response.genText(
          i18n.__("fallback.any", {
            message: this.webhookEvent.message.text
          })
        ),
        Response.genText(i18n.__("get_started.guidance")),
        Response.genQuickReply(i18n.__("get_started.help"), [
          {
            title: i18n.__("menu.suggestion"),
            payload: "CURATION"
          },
          {
            title: i18n.__("menu.help"),
            payload: "CARE_HELP"
          }
        ])
      ];
    }

    return response;
  }

  // Handles mesage events with attachments
  handleAttachmentMessage() {
    let response;

    // Get the attachment
    let attachment = this.webhookEvent.message.attachments[0];
    console.log("Received attachment:", `${attachment} for ${this.user.psid}`);

    response = Response.genQuickReply(i18n.__("fallback.attachment"), [
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      },
      {
        title: i18n.__("menu.start_over"),
        payload: "GET_STARTED"
      }
    ]);

    return response;
  }

  // Handles mesage events with quick replies
  handleQuickReply() {
    // Get the payload of the quick reply
    let payload = this.webhookEvent.message.quick_reply.payload;

    return this.handlePayload(payload);
  }

  // Handles postbacks events
  handlePostback() {
    let postback = this.webhookEvent.postback;
    // Check for the special Get Starded with referral
    let payload;
    if (postback.referral && postback.referral.type == "OPEN_THREAD") {
      payload = postback.referral.ref;
    } else {
      // Get the payload of the postback
      payload = postback.payload;
    }
    return this.handlePayload(payload.toUpperCase());
  }

  // Handles referral events
  handleReferral() {
    // Get the payload of the postback
    let payload = this.webhookEvent.referral.ref.toUpperCase();

    return this.handlePayload(payload);
  }

  handlePayload(payload) {
    console.log("Received Payload:", `${payload} for ${this.user.psid}`);

    // Log CTA event in FBA
    GraphAPi.callFBAEventsAPI(this.user.psid, payload);

    let response;

    // Set the response based on the payload
    if (
      payload === "GET_STARTED" ||
      payload === "DEVDOCS" ||
      payload === "GITHUB"
    ) {
      response = Response.genNuxMessage(this.user);
    } else if (payload.includes("CURATION") || payload.includes("COUPON")) {
      let curation = new Curation(this.user, this.webhookEvent);
      response = curation.handlePayload(payload);
    } else if (payload.includes("CARE")) {
      let care = new Care(this.user, this.webhookEvent);
      response = care.handlePayload(payload);
    } else if (payload.includes("ORDER")) {
      response = Order.handlePayload(payload);
    } else if (payload.includes("CSAT")) {
      response = Survey.handlePayload(payload);
    } else if (payload.includes("CHAT-PLUGIN")) {
      response = [
        Response.genText(i18n.__("chat_plugin.prompt")),
        Response.genText(i18n.__("get_started.guidance")),
        Response.genQuickReply(i18n.__("get_started.help"), [
          {
            title: i18n.__("care.order"),
            payload: "CARE_ORDER"
          },
          {
            title: i18n.__("care.billing"),
            payload: "CARE_BILLING"
          },
          {
            title: i18n.__("care.other"),
            payload: "CARE_OTHER"
          }
        ])
      ];
    } else {
      response = {
        text: `This is a default postback message for payload: ${payload}!`
      };
    }

    return response;
  }

  handlePrivateReply(type, object_id) {
    let welcomeMessage =
      i18n.__("get_started.welcome") +
      " " +
      i18n.__("get_started.guidance") +
      ". " +
      i18n.__("get_started.help");

    let response = Response.genQuickReply(welcomeMessage, [
      {
        title: i18n.__("menu.suggestion"),
        payload: "CURATION"
      },
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      }
    ]);

    let requestBody = {
      recipient: {
        [type]: object_id
      },
      message: response
    };

    GraphAPi.callSendAPI(requestBody);
  }

  sendMessage(response, delay = 0) {
    // Check if there is delay in the response
    if ("delay" in response) {
      delay = response["delay"];
      delete response["delay"];
    }

    // Construct the message body
    let requestBody = {
      recipient: {
        id: this.user.psid
      },
      message: response
    };

    // Check if there is persona id in the response
    if ("persona_id" in response) {
      let persona_id = response["persona_id"];
      delete response["persona_id"];

      requestBody = {
        recipient: {
          id: this.user.psid
        },
        message: response,
        persona_id: persona_id
      };
    }

    setTimeout(() => GraphAPi.callSendAPI(requestBody), delay);
  }

  firstEntity(nlp, name) {
    return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
  }
};
