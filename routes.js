const express = require("express");
const {
  makeOrderId,
  calculateTotal,
  orderResponse,
  validationProblem,
  notFoundProblem,
  validateCreateOrder,
  normalizeItems,
} = require("./utils");

const router = express.Router();
const DEFAULT_ORDER_STATUS = "created";
const orders = [];

function persistOrderWithContext(order) {
  orders.push(order);
  return order;
}

router.post("/", async (req, res, next) => {
  try {
    const validationErrors = validateCreateOrder(req.body);

    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(validationProblem("Invalid order", validationErrors));
    }

    const normalizedCustomerName = req.body.customerName.trim();
    const items = normalizeItems(req.body.items);
    const serverCalculatedTotal = calculateTotal(items);

    const newOrder = {
      id: makeOrderId(),
      customerName: normalizedCustomerName,
      items,
      total: serverCalculatedTotal,
      status: DEFAULT_ORDER_STATUS,
      createdAt: new Date().toISOString(),
    };

    const storedOrder = persistOrderWithContext(newOrder);
    const responseBody = orderResponse(storedOrder);

    return res
      .status(201)
      .location(`/orders/${storedOrder.id}`)
      .json(responseBody);
  } catch (error) {
    return next(error);
  }
});

router.get("/", (req, res) => {
  const result = orders.map((order) => orderResponse(order));
  res.status(200).json({
    orders: result,
    count: result.length,
  });
});

router.get("/:id", (req, res, next) => {
  try {
    const requestedId = req.params.id;
    const matchingOrder = orders.find((order) => order.id === requestedId);

    if (!matchingOrder) {
      return res.status(404).json(notFoundProblem());
    }

    return res.status(200).json(orderResponse(matchingOrder));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const orderId = req.params.id;
    const orderIndex = orders.findIndex((order) => order.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json(notFoundProblem());
    }

    orders.splice(orderIndex, 1);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;