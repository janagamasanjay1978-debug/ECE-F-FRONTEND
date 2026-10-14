import { useEffect, useState } from 'react';
import Jobs from './Jobs';
import './App.css';
const STUDENT_API_URL = 'http://localhost:8082/api/students';
const JOB_API_URL = 'http://localhost:8082/api/jobs';

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [eligibleJobs, setEligibleJobs] = useState({});
  const [eligibilityErrors, setEligibilityErrors] = useState({});

  useEffect(() => {
    fetch(STUDENT_API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load students.');
        }
        return response.json();
      })
      .then((data) => setStudents(data))
      .catch(() => {
        setMessage('Could not load students. Check that the backend is running.');
      });
  }, []);

  function clearForm() {
    setName('');
    setEmail('');
    setCgpa('');
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const isEditing = editingId !== null;
    const url = isEditing
      ? `${STUDENT_API_URL}/${editingId}`
      : STUDENT_API_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          cgpa: Number(cgpa),
        }),
      });

      if (!response.ok) {
        throw new Error('Could not save student.');
      }

      const savedStudent = await response.json();

      if (isEditing) {
        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student.id === editingId ? savedStudent : student,
          ),
        );
        setMessage('Student updated successfully.');
      } else {
        setStudents((currentStudents) => [...currentStudents, savedStudent]);
        setMessage('Student registered successfully.');
      }

      setEligibleJobs({});
      clearForm();
    } catch {
      setMessage('Could not save student. Check that the backend is running.');
    }
  }

  function handleEdit(student) {
    setEditingId(student.id);
    setName(student.name);
    setEmail(student.email);
    setCgpa(student.cgpa == null ? '' : String(student.cgpa));
    setMessage('');
  }

  async function handleDelete(id) {
    setMessage('');

    try {
      const response = await fetch(`${STUDENT_API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete student.');
      }

      setStudents((currentStudents) =>
        currentStudents.filter((student) => student.id !== id),
      );

      setEligibleJobs((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });

      if (editingId === id) {
        clearForm();
      }

      setMessage('Student deleted.');
    } catch {
      setMessage('Could not delete student. Check that the backend is running.');
    }
  }

  async function checkEligibleJobs(student) {
    setEligibilityErrors((current) => ({ ...current, [student.id]: '' }));

    try {
      const response = await fetch(JOB_API_URL);

      if (!response.ok) {
        throw new Error('Could not load jobs.');
      }

      const jobs = await response.json();
      const studentCgpa = Number(student.cgpa);

      const matches = jobs.filter(
        (job) =>
          job.minimumCgpa != null &&
          studentCgpa >= Number(job.minimumCgpa),
      );

      setEligibleJobs((current) => ({
        ...current,
        [student.id]: matches,
      }));
    } catch {
      setEligibilityErrors((current) => ({
        ...current,
        [student.id]: 'Could not check jobs. Make sure the backend is running.',
      }));
    }
  }

  return (
    <main>
      <section>
        <h1>Smart Placement System</h1>
        <h2>{editingId === null ? 'Student Registration' : 'Edit Student'}</h2>

        <form onSubmit={handleSubmit}>
          <p>
            <label>
              Name
              <br />
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          </p>

          <p>
            <label>
              Email
              <br />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          </p>

          <p>
            <label>
              CGPA (0 to 10)
              <br />
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={cgpa}
                onChange={(event) => setCgpa(event.target.value)}
                required
              />
            </label>
          </p>

          <button type="submit">
            {editingId === null ? 'Register Student' : 'Save Changes'}
          </button>

          {editingId !== null && (
            <button type="button" onClick={clearForm}>
              Cancel
            </button>
          )}
        </form>

        <p>{message}</p>

        <h2>Registered Students</h2>

        {students.length === 0 ? (
          <p>No students registered yet.</p>
        ) : (
          <ul>
            {students.map((student) => (
              <li key={student.id}>
                {student.name} — {student.email} — CGPA:{' '}
                {student.cgpa ?? 'Not entered'}{' '}
                <button type="button" onClick={() => handleEdit(student)}>
                  Edit
                </button>{' '}
                <button type="button" onClick={() => handleDelete(student.id)}>
                  Delete
                </button>{' '}
                <button
                  type="button"
                  onClick={() => checkEligibleJobs(student)}
                  disabled={student.cgpa == null}
                  title={
                    student.cgpa == null
                      ? 'Edit this student and enter a CGPA first.'
                      : ''
                  }
                >
                  Check Eligible Jobs
                </button>

                {eligibilityErrors[student.id] && (
                  <p>{eligibilityErrors[student.id]}</p>
                )}

                {eligibleJobs[student.id] && (
                  <div>
                    <strong>Eligible jobs:</strong>
                    {eligibleJobs[student.id].length === 0 ? (
                      <p>No jobs match this student’s CGPA yet.</p>
                    ) : (
                      <ul>
                        {eligibleJobs[student.id].map((job) => (
                          <li key={job.id}>
                            {job.title} at {job.company} — minimum CGPA:{' '}
                            {job.minimumCgpa}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Jobs />
    </main>
  );
}

export default App;