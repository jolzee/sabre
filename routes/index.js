var express = require("express");
var router = express.Router();
var axios = require("axios");
var CryptoJS = require("crypto-js");
const { request } = require("../app");

router.post("/auth", function (req, res, next) {
  var data = "grant_type=client_credentials";

  // Capture username
  const username = req.body.username;
  // Capture PCC
  const pcc = req.body.pcc;
  // Construct raw client id (by appending V1:username:PCC:AA)
  const clientidRaw = `V1:${username}:${pcc}:AA`;
  // Base64 encode the previous string
  const clientidArray = CryptoJS.enc.Utf8.parse(clientidRaw);
  const clientidBase64 = CryptoJS.enc.Base64.stringify(clientidArray);
  // Capture password
  const passwordRaw = req.body.password;
  // Base64 enconde the password
  const passwordArray = CryptoJS.enc.Utf8.parse(passwordRaw);
  const passwordBase64 = CryptoJS.enc.Base64.stringify(passwordArray);
  // Combine the two previous strings with a : in the middle
  const secretRaw = `${clientidBase64}:${passwordBase64}`;
  // Base64 enconde this last string
  const secretArray = CryptoJS.enc.Utf8.parse(secretRaw);
  const secretBase64 = CryptoJS.enc.Base64.stringify(secretArray);
  // Set the secret variable with the latest encoded string

  var config = {
    method: "post",
    url: "https://api-crt.cert.havail.sabre.com/v2/auth/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${secretBase64}`,
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.send({ status: "error" });
    });
});

router.post("/getbooking", function (req, res, next) {
  var data = JSON.stringify({ confirmationId: req.body.confirmationId });

  var config = {
    method: "post",
    url: "https://api-crt.cert.havail.sabre.com/v1/trip/orders/getBooking",
    headers: {
      "Content-Type": "application/json",
      "Conversation-ID": "2020.04.DevStudio",
      Authorization: `Bearer ${req.body.token}`,
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.send({ status: "error" });
    });
});

router.post("/cancelbooking", function (req, res, next) {
  var data = JSON.stringify({
    confirmationId: req.body.confirmationId,
    retrieveBooking: false,
    cancelAll: false,
    errorHandlingPolicy: "ALLOW_PARTIAL_CANCEL",
  });

  var config = {
    method: "post",
    url: "https://api-crt.cert.havail.sabre.com/v1/trip/orders/cancelBooking",
    headers: {
      "Content-Type": "application/json",
      "Conversation-ID": "2020.04.DevStudio",
      Authorization: `Bearer ${req.body.token}`,
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.send({ status: "error" });
    });
});

router.post("/addseats", function (req, res, next) {
  var data = `{{header}}\r\n\r\n<UpdatePassengerNameRecordRQ xmlns="http://services.sabre.com/sp/updatereservation/v1" version="1.0.0">\r\n    <Itinerary id="${req.body.confirmationId}"/>\r\n    <SpecialReqDetails>\r\n        <AirSeat>\r\n            <Seats>\r\n                <Seat NameNumber="1.1" Number="${req.body.seatNumber}" SegmentNumber="${req.body.segmentNumber}"/>\r\n            </Seats>\r\n        </AirSeat>\r\n    </SpecialReqDetails>\r\n    <PostProcessing>\r\n        <EndTransaction>\r\n            <Source ReceivedFrom="API TEST"/>\r\n        </EndTransaction>\r\n    </PostProcessing>\r\n</UpdatePassengerNameRecordRQ>\r\n\r\n{{footer}}`;

  var config = {
    method: "post",
    url: "https://sws-crt.cert.havail.sabre.com",
    headers: {
      "Content-Type": "text/xml",
      Authorization: `Bearer ${req.body.token}`,
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.send({ status: "error" });
    });
});

router.post("/book", function (req, res, next) {
  let outboundData =
    req.body.AirItinerary.OriginDestinationOptions.OriginDestinationOption[0]
      .FlightSegment[0];
  let inboundData =
    req.body.AirItinerary.OriginDestinationOptions.OriginDestinationOption[1]
      .FlightSegment[0];
  let price =
    req.body.AirItineraryPricingInfo[0].ItinTotalFare.TotalFare.Amount;

  let customer = req.body.Customer;

  let oFlightNumber = outboundData.FlightNumber;
  let oResBookDesigCode = outboundData.ResBookDesigCode;
  let oDepartureDateTime = outboundData.DepartureDateTime;
  let oArrivalDateTime = outboundData.ArrivalDateTime;
  let oDepartureAirport = outboundData.DepartureAirport.LocationCode;
  let oArrivalAirport = outboundData.ArrivalAirport.LocationCode;
  let oMarketingAirline = outboundData.MarketingAirline.Code;
  let oOperatingAirline = outboundData.OperatingAirline.Code;

  let iFlightNumber = inboundData.FlightNumber;
  let iResBookDesigCode = inboundData.ResBookDesigCode;
  let iDepartureDateTime = inboundData.DepartureDateTime;
  let iArrivalDateTime = inboundData.ArrivalDateTime;
  let iDepartureAirport = inboundData.DepartureAirport.LocationCode;
  let iArrivalAirport = inboundData.ArrivalAirport.LocationCode;
  let iMarketingAirline = inboundData.MarketingAirline.Code;
  let iOperatingAirline = inboundData.OperatingAirline.Code;

  let itinTotalFare = price;

  let payload = {
    CreatePassengerNameRecordRQ: {
      version: "2.3.0",
      targetCity: req.body.pcc,
      haltOnAirPriceError: true,
      TravelItineraryAddInfo: {
        AgencyInfo: {
          Address: {
            AddressLine: "SABRE TRAVEL",
            CityName: "SOUTHLAKE",
            CountryCode: "US",
            PostalCode: "76092",
            StateCountyProv: {
              StateCode: "TX",
            },
            StreetNmbr: "3150 SABRE DRIVE",
          },
          Ticketing: {
            TicketType: "7TAW",
          },
        },
        CustomerInfo: {
          ContactNumbers: {
            ContactNumber: [
              {
                NameNumber: "1.1",
                Phone: customer.phoneNumber,
                PhoneUseType: "H",
              },
            ],
          },
          CreditCardData: {
            PreferredCustomer: {
              ind: true,
            },
          },
          PersonName: [
            {
              NameNumber: "1.1",
              PassengerType: "ADT",
              GivenName: customer.firstName,
              Surname: customer.lastName,
            },
          ],
          Email: [
            {
              Address: customer.email,
              Type: "BC",
            },
          ],
        },
      },
      AirBook: {
        HaltOnStatus: [
          {
            Code: "HL",
          },
          {
            Code: "KK",
          },
          {
            Code: "LL",
          },
          {
            Code: "NN",
          },
          {
            Code: "NO",
          },
          {
            Code: "UC",
          },
          {
            Code: "US",
          },
        ],
        OriginDestinationInformation: {
          FlightSegment: [
            {
              DepartureDateTime: oDepartureDateTime,
              FlightNumber: oFlightNumber,
              NumberInParty: "1",
              ResBookDesigCode: oResBookDesigCode,
              Status: "NN",
              DestinationLocation: {
                LocationCode: oArrivalAirport,
              },
              MarketingAirline: {
                Code: oMarketingAirline,
                FlightNumber: oFlightNumber,
              },
              MarriageGrp: "O",
              OriginLocation: {
                LocationCode: oDepartureAirport,
              },
            },
            {
              DepartureDateTime: iDepartureDateTime,
              FlightNumber: iFlightNumber,
              NumberInParty: "1",
              ResBookDesigCode: iResBookDesigCode,
              Status: "NN",
              DestinationLocation: {
                LocationCode: iArrivalAirport,
              },
              MarketingAirline: {
                Code: iMarketingAirline,
                FlightNumber: iFlightNumber,
              },
              MarriageGrp: "O",
              OriginLocation: {
                LocationCode: iDepartureAirport,
              },
            },
          ],
        },
        RedisplayReservation: {
          NumAttempts: 3,
          WaitInterval: 1000,
        },
      },
      AirPrice: [
        {
          PriceComparison: {
            AmountSpecified: itinTotalFare,
            AcceptablePriceIncrease: {
              HaltOnNonAcceptablePrice: true,
              Amount: 150,
            },
          },
          PriceRequestInformation: {
            Retain: true,
            OptionalQualifiers: {
              PricingQualifiers: {
                NameSelect: [
                  {
                    NameNumber: "1.1",
                  },
                ],
                PassengerType: [
                  {
                    Code: "ADT",
                    Quantity: "1",
                  },
                ],
              },
            },
          },
        },
      ],
      SpecialReqDetails: {
        AddRemark: {
          RemarkInfo: {
            Remark: [
              {
                Type: "General",
                Text: "WDF100433",
              },
              {
                Type: "Historical",
                Text: "TEST01",
              },
              {
                Type: "Client Address",
                Text: customer.address,
              },
              {
                Type: "Invoice",
                Text: "S*UD18 PROMO515",
              },
            ],
          },
        },
        SpecialService: {
          SpecialServiceInfo: {
            SecureFlight: [
              {
                SegmentNumber: "A",
                PersonName: {
                  DateOfBirth: customer.dateOfBirth,
                  Gender: customer.gender,
                  NameNumber: "1.1",
                  GivenName: customer.firstName,
                  Surname: customer.lastName,
                },
              },
            ],
            Service: [
              {
                SSR_Code: "CTCE",
                SegmentNumber: "A",
                Text: "ADMIN//CURE.NET",
                PersonName: {
                  NameNumber: "1.1",
                },
              },
              {
                SSR_Code: "CTCM",
                Text: "5551231234",
                PersonName: {
                  NameNumber: "1.1",
                },
              },
            ],
          },
        },
      },
      PostProcessing: {
        RedisplayReservation: {
          waitInterval: 100,
        },
        EndTransaction: {
          Source: {
            ReceivedFrom: "API TEST",
          },
        },
      },
    },
  };

  var data = JSON.stringify(payload);

  var config = {
    method: "post",
    url:
      "https://api-crt.cert.havail.sabre.com/v2.3.0/passenger/records?mode=create",
    headers: {
      "Content-Type": "application/json",
      "Conversation-ID": "2020.04.DevStudio",
      Authorization: `Bearer ${req.body.token}`,
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.send({ status: "error" });
    });
});

router.post("/bargain-finder-max", function (req, res, next) {
  let body = req.body;
  // body = {
  //   pcc: "V8TK",
  //   token: "zzz",
  //   maxResults: 5,
  //   seatsRequested: 1,
  //   outbound: {
  //     departureLocationCode: "DEN",
  //     departureTime: "2021-02-19T00:00:00",
  //     destinationLocationCode: "MSP",
  //   },
  //   inbound: {
  //     departureLocationCode: "MSP",
  //     departureTime: "2026-02-19T00:00:00",
  //     destinationLocationCode: "DEN",
  //   },
  // };
  var data = JSON.stringify({
    OTA_AirLowFareSearchRQ: {
      Version: "4.3.0",
      POS: {
        Source: [
          {
            PseudoCityCode: body.pcc,
            RequestorID: {
              Type: "1",
              ID: "1",
              CompanyName: { Code: "TN", content: "TN" },
            },
          },
        ],
      },
      OriginDestinationInformation: [
        {
          RPH: "1",
          DepartureDateTime: body.outbound.departureTime,
          OriginLocation: { LocationCode: body.outbound.departureLocationCode },
          DestinationLocation: {
            LocationCode: body.outbound.destinationLocationCode,
          },
        },
        {
          RPH: "2",
          DepartureDateTime: body.inbound.departureTime,
          OriginLocation: { LocationCode: body.inbound.departureLocationCode },
          DestinationLocation: {
            LocationCode: body.inbound.destinationLocationCode,
          },
        },
      ],
      TravelPreferences: {
        ValidInterlineTicket: true,
        FlightTypePref: { MaxConnections: "0" },
      },
      TravelerInfoSummary: {
        SeatsRequested: [body.seatsRequested],
        AirTravelerAvail: [
          {
            PassengerTypeQuantity: [
              { Code: "ADT", Quantity: body.seatsRequested },
            ],
          },
        ],
      },
      TPA_Extensions: {
        IntelliSellTransaction: { RequestType: { Name: "50ITINS" } },
      },
    },
  });

  var config = {
    method: "post",
    url: `https://api-crt.cert.havail.sabre.com/v4.3.0/shop/flights?mode=live&enabletagging=true&limit=${body.maxResults}&offset=1`,
    headers: {
      "Content-Type": "application/json",
      "Conversation-ID": "2020.04.DevStudio",
      Authorization: `Bearer ${body.token}`,
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.send({ status: "error" });
    });
});

module.exports = router;
