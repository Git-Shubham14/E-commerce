const db =
    require(
        "../config/db"
    );

const {
    safeArray,
    safeNumber,
    safeInteger,
    sanitizeString
} = require(
    "../utils/helpers"
);

// create order service
const createOrderService =
    (
        connection,
        userId,
        items
    ) => {

        return new Promise(
            async (
                resolve,
                reject
            ) => {

                try {

                    // validated items
                    const validatedItems = [];

                    // secure total
                    let calculatedTotal =
                        0;

                    // validate each item
                    const validationPromises =
                        safeArray(
                            items
                        ).map(
                            (
                                item
                            ) => {

                                return new Promise(
                                    (
                                        validationResolve,
                                        validationReject
                                    ) => {

                                        const productId =
                                            safeInteger(
                                                item.id
                                            );

                                        // invalid product id
                                        if (
                                            productId <= 0
                                        ) {

                                            return validationReject(
                                                new Error(
                                                    "Invalid product ID"
                                                )
                                            );
                                        }

                                        const productQuery = `
                                            SELECT
                                                id,
                                                name,
                                                price,
                                                stock,
                                                image
                                            FROM products
                                            WHERE id = ?
                                            LIMIT 1
                                        `;

                                        connection.query(
                                            productQuery,
                                            [
                                                productId
                                            ],
                                            (
                                                productError,
                                                productResults
                                            ) => {

                                                // query error
                                                if (
                                                    productError
                                                ) {

                                                    return validationReject(
                                                        productError
                                                    );
                                                }

                                                const safeResults =
                                                    safeArray(
                                                        productResults
                                                    );

                                                // product missing
                                                if (
                                                    !safeResults.length
                                                ) {

                                                    return validationReject(
                                                        new Error(
                                                            `Product not found: ${productId}`
                                                        )
                                                    );
                                                }

                                                const product =
                                                    safeResults[0];

                                                const qty =
                                                    Math.max(
                                                        1,
                                                        safeInteger(
                                                            item.qty,
                                                            1
                                                        )
                                                    );

                                                // stock validation
                                                if (
                                                    safeInteger(
                                                        product.stock
                                                    ) < qty
                                                ) {

                                                    return validationReject(
                                                        new Error(
                                                            `Insufficient stock for ${sanitizeString(product.name)}`
                                                        )
                                                    );
                                                }

                                                // safe db price
                                                const realPrice =
                                                    safeNumber(
                                                        product.price
                                                    );

                                                const itemTotal =
                                                    realPrice * qty;

                                                // floating-safe total
                                                calculatedTotal =
                                                    Number(
                                                        (
                                                            calculatedTotal +
                                                            itemTotal
                                                        ).toFixed(2)
                                                    );

                                                // save validated item
                                                validatedItems.push({

                                                    id:
                                                        safeInteger(
                                                            product.id
                                                        ),

                                                    name:
                                                        sanitizeString(
                                                            product.name
                                                        ),

                                                    image:
                                                        sanitizeString(
                                                            product.image
                                                        ),

                                                    price:
                                                        realPrice,

                                                    qty,

                                                    color:
                                                        sanitizeString(
                                                            item.color
                                                        ),

                                                    size:
                                                        sanitizeString(
                                                            item.size
                                                        )
                                                });

                                                validationResolve();
                                            }
                                        );
                                    }
                                );
                            }
                        );

                    // wait validation
                    await Promise.all(
                        validationPromises
                    );

                    // create order
                    const orderQuery = `
                        INSERT INTO orders (
                            user_id,
                            total,
                            items,
                            status
                        )
                        VALUES (?, ?, ?, ?)
                    `;

                    connection.query(
                        orderQuery,
                        [
                            safeInteger(
                                userId
                            ),

                            calculatedTotal,

                            JSON.stringify(
                                validatedItems
                            ),

                            "pending"
                        ],
                        (
                            orderError,
                            orderResult
                        ) => {

                            // rollback
                            if (
                                orderError
                            ) {

                                return connection.rollback(
                                    () => {

                                        reject(
                                            orderError
                                        );
                                    }
                                );
                            }

                            // reduce stock
                            const stockPromises =
                                validatedItems.map(
                                    (
                                        item
                                    ) => {

                                        return new Promise(
                                            (
                                                stockResolve,
                                                stockReject
                                            ) => {

                                                const stockQuery = `
                                                    UPDATE products
                                                    SET stock = stock - ?
                                                    WHERE id = ?
                                                `;

                                                connection.query(
                                                    stockQuery,
                                                    [
                                                        item.qty,
                                                        item.id
                                                    ],
                                                    (
                                                        stockError
                                                    ) => {

                                                        if (
                                                            stockError
                                                        ) {

                                                            return stockReject(
                                                                stockError
                                                            );
                                                        }

                                                        stockResolve();
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );

                            Promise.all(
                                stockPromises
                            )

                                .then(
                                    () => {

                                        connection.commit(
                                            (
                                                commitError
                                            ) => {

                                                if (
                                                    commitError
                                                ) {

                                                    return connection.rollback(
                                                        () => {

                                                            reject(
                                                                commitError
                                                            );
                                                        }
                                                    );
                                                }

                                                resolve({

                                                    success:
                                                        true,

                                                    orderId:
                                                        orderResult.insertId,

                                                    total:
                                                        calculatedTotal,

                                                    items:
                                                        validatedItems
                                                });
                                            }
                                        );
                                    }
                                )

                                .catch(
                                    (
                                        stockError
                                    ) => {

                                        connection.rollback(
                                            () => {

                                                reject(
                                                    stockError
                                                );
                                            }
                                        );
                                    }
                                );
                        }
                    );

                } catch (error) {

                    connection.rollback(
                        () => {

                            reject(
                                error
                            );
                        }
                    );
                }
            }
        );
    };

// get orders service
const getOrdersService =
    () => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const query = `
                    SELECT *
                    FROM orders
                    ORDER BY created_at DESC
                `;

                db.query(
                    query,
                    (
                        error,
                        results
                    ) => {

                        if (
                            error
                        ) {

                            return reject(
                                error
                            );
                        }

                        resolve(
                            safeArray(
                                results
                            )
                        );
                    }
                );
            }
        );
    };

module.exports = {

    createOrderService,

    getOrdersService
};