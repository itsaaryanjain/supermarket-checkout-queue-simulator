
// Customer waiting queue. Priority customers are placed before normal customers.
const queue = [
    { name: "Priya", items: 6, priority: false, order: 1 }
];

// Four checkout counters. A null customer means the counter is free.
const counters = [
    { name: "Counter 1", customer: null },
    { name: "Counter 2", customer: { name: "Rahul", items: 5 } },
    { name: "Counter 3", customer: null },
    { name: "Counter 4", customer: { name: "Aman", items: 3 } }
];

let totalCustomers = 3;
let completedBills = 0;
let nextOrder = 2;

// Customer history
let completedCustomers = [];

// Get HTML elements
const form = document.getElementById("customerForm");
const queueTable = document.getElementById("queueTable");

// Load previously saved data
let savedData = localStorage.getItem("superMartData");

if (savedData !== null) {
    try {
        let oldData = JSON.parse(savedData);

        if (Array.isArray(oldData.queue) &&
            Array.isArray(oldData.counters) &&
            oldData.counters.length === counters.length) {

            queue.splice(0, queue.length, ...oldData.queue);

            oldData.counters.forEach(function(savedCounter, index) {
                counters[index].customer = savedCounter.customer;
            });

            totalCustomers = oldData.totalCustomers;
            completedBills = oldData.completedBills;
            completedCustomers = oldData.completedCustomers || [];
            nextOrder = oldData.nextOrder || 2;
        }
    } catch (error) {
        console.log("Saved data could not be loaded.");
    }
}

// Save all project data
function saveState() {
    let data = {
        queue: queue,
        counters: counters,
        totalCustomers: totalCustomers,
        completedBills: completedBills,
        completedCustomers: completedCustomers,
        nextOrder: nextOrder
    };

    localStorage.setItem("superMartData", JSON.stringify(data));
}


// Add a new customer to the queue.
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const items = Number(document.getElementById("itemCount").value);
    const priority = document.getElementById("isPriority").checked;

    if (name === "" || !Number.isInteger(items) || items < 1 || items > 100) {
        alert("Enter a valid name and item quantity.");
        return;
    }

    const customer = {
        name: name,
        items: items,
        priority: priority,
        order: nextOrder
    };

    nextOrder++;

    if (priority) {
        const firstNormal = queue.findIndex(function(person) {
            return person.priority === false;
        });

        if (firstNormal === -1) {
            queue.push(customer);
        } else {
            queue.splice(firstNormal, 0, customer);
        }
    } else {
        queue.push(customer);
    }

    totalCustomers++;

    form.reset();
    document.getElementById("itemCount").value = 5;

    updatePage();

    document.getElementById("simulationStatus").textContent =
        "Customer added";
});


// Send customers from the queue to free counters.
function assignCustomers() {
    counters.forEach(function(counter) {
        if (counter.customer === null && queue.length > 0) {
            counter.customer = queue.shift();
        }
    });

    updatePage();

    document.getElementById("simulationStatus").textContent =
        "Customers assigned";
}


// Complete the first active bill and bring in the next waiting customer.
function completeBill() {
    const busyCounter = counters.find(function(counter) {
        return counter.customer !== null;
    });

    if (busyCounter === undefined) {
        document.getElementById("simulationStatus").textContent =
            "No active bill";
        return;
    }

    // Add completed customer to history
    completedCustomers.push({
        name: busyCounter.customer.name,
        items: busyCounter.customer.items,
        counter: busyCounter.name,
        status: "Completed"
    });

    busyCounter.customer = null;
    completedBills++;

    if (queue.length > 0) {
        busyCounter.customer = queue.shift();
    }

    updatePage();

    document.getElementById("simulationStatus").textContent =
        "Bill completed";
}


// A simple estimated waiting time for each person in the queue.
function getWaitTime(position, items) {
    const freeCounters = counters.filter(function(counter) {
        return counter.customer === null;
    }).length;

    const turns = Math.floor(
        (position + freeCounters) / counters.length
    );

    const minutes = turns * 4 + Math.ceil(items / 3);

    return minutes + " min";
}


// Refresh dashboard, queue table and counter cards.
function updatePage() {
    let busyCount = 0;

    counters.forEach(function(counter) {
        if (counter.customer !== null) {
            busyCount++;
        }
    });

    document.getElementById("totalCustomers").textContent = totalCustomers;

    document.getElementById("waitingCustomers").textContent =
        queue.length;

    document.getElementById("busyCounters").textContent =
        busyCount + " / 4";

    document.getElementById("availableCounters").textContent =
        (4 - busyCount) + " / 4";

    document.getElementById("completedBills").textContent =
        completedBills;


    // Update waiting queue table
    queueTable.innerHTML = "";

    let totalWait = 0;

    queue.forEach(function(customer, index) {
        const wait = getWaitTime(index, customer.items);

        totalWait += Number(wait.split(" ")[0]);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.name}</td>
            <td>${customer.items}</td>
            <td>${customer.priority ? "Priority" : "Normal"}</td>
            <td>${wait}</td>
            <td>Waiting</td>
        `;

        queueTable.appendChild(row);
    });


    // Calculate average waiting time
    if (queue.length === 0) {
        queueTable.innerHTML =
            '<tr><td colspan="6">No customers waiting.</td></tr>';

        document.getElementById("averageWait").textContent = "0 min";

    } else {
        document.getElementById("averageWait").textContent =
            Math.round(totalWait / queue.length) + " min";
    }


    // Update checkout counter cards
    const counterGrid = document.getElementById("counterGrid");

    counterGrid.innerHTML = "";

    counters.forEach(function(counter) {
        const card = document.createElement("div");

        const isBusy = counter.customer !== null;

        card.className = isBusy
            ? "counter busy"
            : "counter available";

        if (isBusy) {
            card.innerHTML = `
                <h3>${counter.name} - Busy</h3>
                <p>${counter.customer.name} - ${counter.customer.items} items</p>
            `;
        } else {
            card.innerHTML = `
                <h3>${counter.name} - Available</h3>
                <p>No customer</p>
            `;
        }

        counterGrid.appendChild(card);
    });

    // Save updated data
    saveState();
}


// Connect buttons
document.getElementById("startButton").addEventListener(
    "click", assignCustomers
);

document.getElementById("completeButton").addEventListener(
    "click", completeBill
);


// Reset the simulator
document.getElementById("resetButton").addEventListener(
    "click", function() {

        queue.length = 0;

        queue.push({
            name: "Priya",
            items: 6,
            priority: false,
            order: 1
        });

        counters[0].customer = null;
        counters[1].customer = {
            name: "Rahul",
            items: 5
        };

        counters[2].customer = null;

        counters[3].customer = {
            name: "Aman",
            items: 3
        };

        totalCustomers = 3;
        completedBills = 0;
        nextOrder = 2;

        // Clear customer history
        completedCustomers = [];

        // Clear old saved data
        localStorage.removeItem("superMartData");

        updatePage();

        document.getElementById("simulationStatus").textContent =
            "Demo reset";
    }
);


// Show the starting data on the page.
updatePage();


