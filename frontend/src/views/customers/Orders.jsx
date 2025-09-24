import React from "react";
import Sidebar from "./Sidebar";

const Orders = () => {
  // sample orders data
  const orders = [
    {
      id: "#ouwieurwer",
      date: "13th December 2024",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      total: "$75.00",
    },
    {
      id: "#ouwieurwer",
      date: "13th December 2024",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      total: "$75.00",
    },
    {
      id: "#ouwieurwer",
      date: "13th December 2024",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      total: "$75.00",
    },
    {
      id: "#ouwieurwer",
      date: "13th December 2024",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      total: "$75.00",
    },
  ];

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="col-lg-9">
          {/* Top Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card shadow-sm border-0 text-center p-4 bg-light rounded">
                <h6 className="text-muted mb-2">Orders</h6>
                <h3 className="fw-bold">9</h3>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card shadow-sm border-0 text-center p-4 bg-primary text-white rounded">
                <h6 className="text-light mb-2">Pending Delivery</h6>
                <h3 className="fw-bold">6</h3>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card shadow-sm border-0 text-center p-4 bg-success text-white rounded">
                <h6 className="text-light mb-2">Fulfilled Orders</h6>
                <h3 className="fw-bold">2</h3>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="card shadow-sm border-0 rounded">
            <div className="card-body">
              <h5 className="card-title mb-4">Recent Orders</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Payment Status</th>
                      <th>Order Status</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, idx) => (
                      <tr key={idx} className="align-middle">
                        <td>
                          <strong>{order.id}</strong>
                          <br />
                          <small className="text-muted">{order.date}</small>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              order.paymentStatus === "Paid"
                                ? "bg-success"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              order.orderStatus === "Fulfilled"
                                ? "bg-success"
                                : order.orderStatus === "Pending"
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>${order.total}</td>
                        <td>
                          <a
                            href="#"
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
