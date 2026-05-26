// validated items
const validatedItems = [];

// secure total
let calculatedTotal =
    0;

// validate each item from database
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

                    // validate item id
                    const productId =
                        safeInteger(
                            item.id
                        );

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

                            // product not found
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

                            // secure database price
                            const realPrice =
                                safeNumber(
                                    product.price
                                );

                            const itemTotal =
                                realPrice * qty;

                            // floating point safe total
                            calculatedTotal =
                                Number(
                                    (
                                        calculatedTotal +
                                        itemTotal
                                    ).toFixed(2)
                                );

                            // validated item
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