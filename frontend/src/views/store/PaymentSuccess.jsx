import React, { useEffect, useRef, useState } from "react";
import apiInstance from "../../utils/axios";
import { useParams } from "react-router-dom";

const PaymentSuccess = () => {
  const [order, setOrder] = useState({});
  const [status, setStatus] = useState("Verifying");
  const param = useParams();

  const urlParam = new URLSearchParams(window.location.search);
  const sessionId = urlParam.get("session_id");

  // Prevent double verification
  const verified = useRef(false);

  // -------- Load Order -------- //
  useEffect(() => {
    apiInstance.get(`checkout/${param.order_oid}/`).then((res) => {
      setOrder(res.data);
    });
  }, [param.order_oid]);

  // -------- Verify Payment (Run Only Once) -------- //
  useEffect(() => {
    if (!order?.oid) return;

    if (verified.current) return;        // 👈 Prevent double API call
    verified.current = true;

    const formdata = new FormData();
    formdata.append("order_oid", param.order_oid);
    formdata.append("session_id", sessionId);

    apiInstance
      .post(`payment-success/${order.oid}/`, formdata)
      .then((res) => {
        setStatus(res.data.message);
      })
      .catch(() => {
        setStatus("Your Invoice is Unpaid");
      });
  }, [order]);

  return (
    <main className="mb-4 mt-4 h-100">
      <div className="container">
        <section>
          <div className="row justify-content-center">
            <div className="col-xl-10">

              {/* ================= VERIFICATION ================= */}
              {status === "Verifying" && (
                <div className="card bg-white shadow p-5 text-center">
                  <i
                    className="fa fa-spinner fa-spin"
                    style={{ fontSize: 80, color: "green" }}
                  ></i>
                  <h2 className="mt-3">Payment Verifying...</h2>
                  <p className="text-danger"><b>Do not refresh the page</b></p>
                </div>
              )}

              {/* ================= SUCCESS ================= */}
              {status === "Payment Successfull" && (
                <div className="card bg-white shadow p-5 text-center">
                  <i
                    className="fa fa-check-circle text-success"
                    style={{ fontSize: 100 }}
                  ></i>
                  <h1 className="mt-3">Thank You!</h1>
                  <p>
                    Order ID: <b>#{order.oid}</b> <br />
                    A confirmation email has been sent to:
                    <b> {order.email}</b>
                  </p>

                  <button
                    className="btn btn-success mt-3"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal"
                  >
                    View Order <i className="fas fa-eye"></i>
                  </button>
                </div>
              )}

              {/* ================= ALREADY PAID ================= */}
              {status === "Already Paid" && (
                <div className="card bg-white shadow p-5 text-center">
                  <i
                    className="fa fa-check-circle text-success"
                    style={{ fontSize: 100 }}
                  ></i>
                  <h1 className="mt-3">Already Paid!</h1>
                  <p>
                    Order ID: <b>#{order.oid}</b>  
                    <br />
                    Email sent to: <b>{order.email}</b>
                  </p>

                  <button
                    className="btn btn-success mt-3"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal"
                  >
                    View Order <i className="fas fa-eye"></i>
                  </button>
                </div>
              )}

              {/* ================= UNPAID ================= */}
              {status === "Your Invoice is Unpaid" && (
                <div className="card bg-white shadow p-5 text-center">
                  <i
                    className="fas fa-times-circle text-danger"
                    style={{ fontSize: 100 }}
                  ></i>
                  <h1 className="mt-3">Invoice Unpaid</h1>
                  <p className="text-danger">
                    Please try making the payment again.
                  </p>
                </div>
              )}

            </div>
          </div>
        </section>
      </div>

      {/* ================= MODAL (Order Summary) ================= */}
      <div className="modal fade" id="exampleModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">Order Summary</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body text-start p-4">

              <h5 className="text-uppercase">{order.full_name}</h5>
              <h6>{order.email}</h6>
              <h6>{order.mobile}</h6>
              <hr />

              <p className="fw-bold">Payment Summary</p>

              {order.orderitem?.map((o, index) => (
                <div key={index} className="d-flex justify-content-between shadow p-2 rounded-2 mb-2">
                  <p>{o.product?.title}</p>
                  <p>${o.price}</p>
                </div>
              ))}

              <div className="d-flex justify-content-between">
                <p>Sub Total</p> <p>${order.sub_total}</p>
              </div>
              <div className="d-flex justify-content-between">
                <p>Shipping Fee</p> <p>${order.shipping_amount}</p>
              </div>
              <div className="d-flex justify-content-between">
                <p>Tax Fee</p> <p>${order.tax_fee}</p>
              </div>
              <div className="d-flex justify-content-between">
                <p>Service Fee</p> <p>${order.service_fee}</p>
              </div>
              <div className="d-flex justify-content-between fw-bold">
                <p>Total</p> <p>${order.total}</p>
              </div>

            </div>

          </div>
        </div>
      </div>

    </main>
  );
};

export default PaymentSuccess;
