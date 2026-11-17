
// Read saved project data
let savedData = localStorage.getItem("superMartData");

let data = savedData ? JSON.parse(savedData) : null;

let history = data ? data.completedCustomers || [] : [];
let queue = data ? data.queue || [] : [];


// Customer History
let historyTable = document.getElementById("historyTable");

if (history.length > 0) {

    historyTable.innerHTML = "";

    history.forEach(function(customer) {

        let row = `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.items}</td>
                <td>${customer.counter}</td>
                <td>Completed</td>
            </tr>
        `;

        historyTable.innerHTML += row;
    });

} else {

    historyTable.innerHTML =
        '<tr><td colspan="4">No completed customers yet.</td></tr>';
}


// Waiting Time Estimation
let waitingTable = document.getElementById("waitingTable");

if (queue.length > 0 && data && data.counters) {

    waitingTable.innerHTML = "";

    // Count available counters
    let freeCounters = data.counters.filter(function(counter) {
        return counter.customer === null;
    }).length;


    queue.forEach(function(customer, index) {

        // Calculate waiting time using the main simulator formula
        let turns = Math.floor(
            (index + freeCounters) / data.counters.length
        );

        let waitTime = turns * 4 + Math.ceil(customer.items / 3);

        let row = `
            <tr>
                <td>${index + 1}</td>
                <td>${customer.name}</td>
                <td>${customer.items}</td>
                <td>${customer.priority ? "Priority" : "Normal"}</td>
                <td>${waitTime} min</td>
            </tr>
        `;

        waitingTable.innerHTML += row;
    });

} else {

    waitingTable.innerHTML =
        '<tr><td colspan="5">No customers waiting.</td></tr>';
}

