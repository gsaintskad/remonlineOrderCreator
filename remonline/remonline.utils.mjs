
import fetch from 'node-fetch';
import { remonlineTokenToEnv } from './remonline.api.mjs'

async function getOrderLable(orderId) {

    const response = await fetch(`${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}&ids[]=${orderId}`);
    const data = await response.json();

    const { success } = data
    if (!success) {
        const { message } = data
        const { validation } = message
        console.error({ function: 'getOrderLable', message, validation, status: response.status() })
        return
    }
    const { data: orders, count } = data
    if (count == 0) {
        return { idLabel: null }
    }
    const [order] = orders
    const { id_label: idLabel } = order
    return { idLabel }
}

export async function createOrder({
    malfunction,
    scheduledFor,
    plateNumber,
    remonlineId,
    branchPublicName,
    branchId,
    managerId
}) {

    const params = new URLSearchParams();
    params.append('duration', 60);

    params.append('token', process.env.REMONLINE_API_TOKEN);
    params.append('branch_id', branchId);
    params.append('order_type', process.env.ORDER_TYPE_REPAIR);
    params.append('client_id', remonlineId);
    params.append('manager', managerId);

    params.append('malfunction', malfunction);
    params.append('scheduled_for', scheduledFor);

    params.append('custom_fields', JSON.stringify({
        // 5294178: carMilleage,
        // 5294177: title,
        // 6728288: city,
        // 6728289: phone,
        // 6329336: telegramId,
        6728287: plateNumber,
        6728288: branchPublicName
    }));

    const response = await fetch(`${process.env.REMONLINE_API}/order/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });


    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'createOrder', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await createOrder({
                malfunction,
                scheduledFor,
                plateNumber,
                remonlineId,
                branchPublicName,
                branchId,
                managerId
            });
        }

        console.error({ function: 'createOrder', message, validation, status: response.status })
        return
    }

    const { data: createdData } = data
    const { id: orderId } = createdData
    const { idLabel } = await getOrderLable(orderId)
    return { orderId, idLabel };
}

export async function getClientsByPhone({
    nationalNumber
}) {

    const response = await fetch(`${process.env.REMONLINE_API}/clients/?token=${process.env.REMONLINE_API_TOKEN}&phones[]=${nationalNumber}`);


    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'getClientsByPhone', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await getClientsByPhone({ nationalNumber });
        }

        console.error({ function: 'createOrder', message, validation, status: response.status })
        return
    }

    const { data: clientsList, count } = data
    return { clientsList, count }

}

export async function createClient({
    email,
    fullName,
    number,
    telegramId,
    branchPublicName
}) {

    const params = new URLSearchParams();
    params.append('token', process.env.REMONLINE_API_TOKEN);
    params.append('name', fullName);
    params.append('phone[]', number);

    if (email) {
        params.append('email', email);
    }

    params.append('custom_fields', JSON.stringify({
        6729251: telegramId.toString(),
        5370833: 'Зовнішній клієнт',
        6879276: branchPublicName
    }));

    const response = await fetch(`${process.env.REMONLINE_API}/clients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });


    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'createClient', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await createClient({
                email,
                fullName,
                number,
                telegramId,
                branchPublicName
            });
        }

        console.error({ function: 'createClient', message, validation, status: response.status })
        return
    }

    const { data: createdData } = data
    // console.log({ createdData })
    const { id: clientId } = createdData
    return { clientId };
}

export async function editClient({
    id,
    branchPublicName
}) {

    const params = new URLSearchParams();
    params.append('token', process.env.REMONLINE_API_TOKEN);
    params.append('id', id);
    params.append('custom_fields', JSON.stringify({
        6879276: branchPublicName
    }));

    const response = await fetch(`${process.env.REMONLINE_API}/clients/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });


    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'editClient', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await editClient({
                id,
                branchPublicName
            });
        }

        console.error({ function: 'editClient', message, validation, status: response.status })
        return
    }

    const { data: editData } = data
    const { id: clientId } = editData
    return { clientId };
}


if (process.env.REMONLINE_MODE == 'dev') {
    (async () => {
        await remonlineTokenToEnv();
        createOrder({ malfunction: '?', scheduledFor: new Date().getTime(), plateNumber: '??', telegramId: '???' });
        // getClientsByPhone({ nationalNumber: '0931630786' })
    })()
}
