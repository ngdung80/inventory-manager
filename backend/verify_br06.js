async function verify() {
    const baseURL = 'http://localhost:5000/api';
    try {
        // 1. Login
        console.log('--- Logging in ---');
        const loginRes = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful');

        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Add a product with reorderLevel
        console.log('\n--- Adding test product ---');
        const productRes = await fetch(`${baseURL}/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test BR-06-Fetch',
                description: 'Item to test reorder rule with fetch',
                price: 150,
                stock: 30,
                reorderLevel: 10
            })
        });
        const productData = await productRes.json();
        const productId = productData.id;
        console.log(`Product added with ID: ${productId}, Stock: 30, ReorderLevel: 10`);

        // 3. Try to place a PURCHASE order (Should fail because Stock 30 > Reorder 10)
        console.log('\n--- Placing PURCHASE order (Stock 30 > Reorder 10) ---');
        const failOrderRes = await fetch(`${baseURL}/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'PURCHASE',
                totalAmount: 150,
                items: [{ productId, quantity: 5, price: 150 }]
            })
        });
        if (failOrderRes.status === 400) {
            const errorData = await failOrderRes.json();
            console.log('Success: Order rejected as expected.');
            console.log('Error status:', failOrderRes.status);
            console.log('Error message:', errorData.error);
        } else {
            console.log('ERROR: Order should have been rejected (400) but status was:', failOrderRes.status);
        }

        // 4. Update stock to below reorderLevel
        console.log('\n--- Updating stock below reorder level ---');
        await fetch(`${baseURL}/products/${productId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                name: 'Test BR-06-Fetch',
                description: 'Item to test reorder rule with fetch',
                price: 150,
                stock: 5,
                reorderLevel: 10
            })
        });
        console.log('Stock updated to 5');

        // 5. Try to place a PURCHASE order (Should succeed because Stock 5 <= Reorder 10)
        console.log('\n--- Placing PURCHASE order (Stock 5 <= Reorder 10) ---');
        const successOrderRes = await fetch(`${baseURL}/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'PURCHASE',
                totalAmount: 150,
                items: [{ productId, quantity: 5, price: 150 }]
            })
        });
        if (successOrderRes.ok) {
            const orderData = await successOrderRes.json();
            console.log('Success: Order accepted as expected.');
            console.log('Order ID:', orderData.id);
        } else {
            const errorData = await successOrderRes.json();
            console.log('ERROR: Order was rejected but it should have been accepted!');
            console.log('Error:', errorData);
        }

        // 6. Cleanup (Optional)
        console.log('\n--- Cleaning up ---');
        await fetch(`${baseURL}/products/${productId}`, { method: 'DELETE', headers });
        console.log('Test product deleted');

    } catch (err) {
        console.error('Verification failed:', err.message);
    }
}

verify();
