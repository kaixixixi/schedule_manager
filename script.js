const SUPABASE_URL = 'https://kqiihcjmwaqkuttuqjj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C24NFWvNKcq0qEVUbvazg_PsJL1...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let schedules =
    JSON.parse(localStorage.getItem("studentSchedules")) || [];

let editId = null;

const scheduleForm =
    document.getElementById("scheduleForm");

const studentName =
    document.getElementById("studentName");

const section =
    document.getElementById("section");

const subjectCode =
    document.getElementById("subjectCode");

const subjectName =
    document.getElementById("subjectName");

const instructor =
    document.getElementById("instructor");

const room =
    document.getElementById("room");

const day =
    document.getElementById("day");

const classType =
    document.getElementById("classType");

const startTime =
    document.getElementById("startTime");

const endTime =
    document.getElementById("endTime");

const search =
    document.getElementById("search");

const filterDay =
    document.getElementById("filterDay");

const scheduleContainer =
    document.getElementById("scheduleContainer");

const scheduleCount =
    document.getElementById("scheduleCount");

const studentDisplay =
    document.getElementById("studentDisplay");

const submitBtn =
    document.getElementById("submitBtn");

const cancelBtn =
    document.getElementById("cancelBtn");


/* Add or Update Class */

scheduleForm.addEventListener("submit", function(event) {

    event.preventDefault();

    if (
        !subjectCode.value.trim() ||
        !subjectName.value.trim() ||
        !instructor.value.trim() ||
        !room.value.trim() ||
        !day.value ||
        !startTime.value ||
        !endTime.value
    ) {

        alert("Please complete all required fields.");

        return;
    }

    if (startTime.value >= endTime.value) {

        alert("End time must be later than start time.");

        return;
    }


    /* Check Schedule Conflict */

    const conflict = schedules.some(schedule => {

        if (schedule.id === editId) {
            return false;
        }

        if (schedule.day !== day.value) {
            return false;
        }

        return (
            startTime.value < schedule.endTime &&
            endTime.value > schedule.startTime
        );

    });


    if (conflict) {

        const proceed = confirm(
            "There is already a class scheduled during this time. Do you want to continue?"
        );

        if (!proceed) {
            return;
        }
    }


    /* Update */

    if (editId !== null) {

        const index =
            schedules.findIndex(
                schedule => schedule.id === editId
            );

        schedules[index] = {

            ...schedules[index],

            subjectCode:
                subjectCode.value.trim(),

            subjectName:
                subjectName.value.trim(),

            instructor:
                instructor.value.trim(),

            room:
                room.value.trim(),

            day:
                day.value,

            classType:
                classType.value,

            startTime:
                startTime.value,

            endTime:
                endTime.value

        };

        alert("Class schedule updated successfully.");

        editId = null;

        submitBtn.textContent = "Add Class";

        cancelBtn.style.display = "none";

    }

    /* Add */

    else {

        const newSchedule = {

            id: Date.now(),

            subjectCode:
                subjectCode.value.trim(),

            subjectName:
                subjectName.value.trim(),

            instructor:
                instructor.value.trim(),

            room:
                room.value.trim(),

            day:
                day.value,

            classType:
                classType.value,

            startTime:
                startTime.value,

            endTime:
                endTime.value

        };
    supabase
            .from('schedules')
            .insert([
                {
                    title: newSchedule.subjectName,
                    description: `${newSchedule.subjectCode} - ${newSchedule.instructor} (${newSchedule.room}) - ${newSchedule.day}`,
                    start_time: newSchedule.startTime,
                    end_time: newSchedule.endTime
                }
            ])
            .then(({ error }) => {
                if (error) {
                    console.error('Supabase Error:', error.message);
                } else {
                    console.log('Saved to Supabase successfully!');
                }
            });

        schedules.push(newSchedule);

        alert("Class schedule added successfully.");

    }

        schedules.push(newSchedule);

        alert("Class schedule added successfully.");

    }


    saveSchedules();

    scheduleForm.reset();

    displaySchedules();

});


/* Display */

function displaySchedules() {

    const searchText =
        search.value.toLowerCase();

    const selectedDay =
        filterDay.value;


    let filteredSchedules =
        schedules.filter(schedule => {

            const matchesSearch =

                schedule.subjectName
                    .toLowerCase()
                    .includes(searchText)

                ||

                schedule.subjectCode
                    .toLowerCase()
                    .includes(searchText);


            const matchesDay =

                selectedDay === "All" ||

                schedule.day === selectedDay;


            return matchesSearch && matchesDay;

        });


    /* Sort by Day and Time */

    const dayOrder = {

        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6

    };


    filteredSchedules.sort((a, b) => {

        if (dayOrder[a.day] !== dayOrder[b.day]) {

            return dayOrder[a.day] -
                   dayOrder[b.day];

        }

        return a.startTime.localeCompare(
            b.startTime
        );

    });


    scheduleContainer.innerHTML = "";


    scheduleCount.textContent =

        `${filteredSchedules.length} ${
            filteredSchedules.length === 1
                ? "class"
                : "classes"
        }`;


    if (filteredSchedules.length === 0) {

        scheduleContainer.innerHTML = `

            <div class="empty">

                No class schedules found.

            </div>

        `;

        return;
    }


    filteredSchedules.forEach(schedule => {

        const card =
            document.createElement("div");

        card.className =
            "schedule-card";


        card.innerHTML = `

            <h3>
                ${escapeHTML(schedule.subjectName)}
            </h3>

            <div class="subject-code">

                ${escapeHTML(schedule.subjectCode)}

            </div>

            <div class="schedule-info">

                <strong>Day:</strong>
                ${schedule.day}

                <br>

                <strong>Time:</strong>
                ${formatTime(schedule.startTime)}
                -
                ${formatTime(schedule.endTime)}

                <br>

                <strong>Instructor:</strong>
                ${escapeHTML(schedule.instructor)}

                <br>

                <strong>Room:</strong>
                ${escapeHTML(schedule.room)}

            </div>

            <span class="class-type">

                ${schedule.classType}

            </span>

            <div class="actions">

                <button
                    class="edit-btn"
                    onclick="editSchedule(${schedule.id})">

                    Edit

                </button>

                <button
                    class="delete-btn"
                    onclick="deleteSchedule(${schedule.id})">

                    Delete

                </button>

            </div>

        `;

        scheduleContainer.appendChild(card);

    });

}


/* Edit */

function editSchedule(id) {

    const schedule =
        schedules.find(
            schedule => schedule.id === id
        );


    if (!schedule) {
        return;
    }


    subjectCode.value =
        schedule.subjectCode;

    subjectName.value =
        schedule.subjectName;

    instructor.value =
        schedule.instructor;

    room.value =
        schedule.room;

    day.value =
        schedule.day;

    classType.value =
        schedule.classType;

    startTime.value =
        schedule.startTime;

    endTime.value =
        schedule.endTime;


    editId = id;

    submitBtn.textContent =
        "Update Class";

    cancelBtn.style.display =
        "inline-block";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* Cancel Edit */

function cancelEdit() {

    editId = null;

    scheduleForm.reset();

    submitBtn.textContent =
        "Add Class";

    cancelBtn.style.display =
        "none";
}


/* Delete */

function deleteSchedule(id) {

    const schedule =
        schedules.find(
            schedule => schedule.id === id
        );


    if (!schedule) {
        return;
    }


    const confirmed = confirm(

        `Delete ${schedule.subjectCode} - ${schedule.subjectName}?`

    );


    if (!confirmed) {
        return;
    }


    schedules =
        schedules.filter(
            schedule => schedule.id !== id
        );


    saveSchedules();

    displaySchedules();

}


/* Save */

function saveSchedules() {

    localStorage.setItem(

        "studentSchedules",

        JSON.stringify(schedules)

    );

}


/* Format Time */

function formatTime(time) {

    const parts =
        time.split(":");

    let hours =
        parseInt(parts[0]);

    const minutes =
        parts[1];

    const ampm =
        hours >= 12
            ? "PM"
            : "AM";

    hours =
        hours % 12 || 12;

    return `${hours}:${minutes} ${ampm}`;

}


/* Protect Display */

function escapeHTML(text) {

    return text

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* Student Information */

function updateStudentDisplay() {

    const name =
        studentName.value.trim();

    const studentSection =
        section.value.trim();


    if (name && studentSection) {

        studentDisplay.textContent =
            `${name} • ${studentSection}`;

    }

    else if (name) {

        studentDisplay.textContent =
            name;

    }

    else if (studentSection) {

        studentDisplay.textContent =
            `Section: ${studentSection}`;

    }

    else {

        studentDisplay.textContent =
            "";

    }

}


studentName.addEventListener(
    "input",
    updateStudentDisplay
);

section.addEventListener(
    "input",
    updateStudentDisplay
);


/* Search */

search.addEventListener(
    "input",
    displaySchedules
);


/* Filter */

filterDay.addEventListener(
    "change",
    displaySchedules
);


/* Initial Display */

displaySchedules();
updateStudentDisplay();
