import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8082/api/jobs';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [minimumCgpa, setMinimumCgpa] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load jobs.');
        }
        return response.json();
      })
      .then((data) => setJobs(data))
      .catch(() => {
        setMessage('Could not load jobs. Check that the backend is running.');
      });
  }, []);

  function clearForm() {
    setTitle('');
    setCompany('');
    setLocation('');
    setDescription('');
    setMinimumCgpa('');
    setRequiredSkills('');
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const isEditing = editingId !== null;
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          location,
          description,
          minimumCgpa: Number(minimumCgpa),
          requiredSkills,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not save the job.');
      }

      const savedJob = await response.json();

      if (isEditing) {
        setJobs((currentJobs) =>
          currentJobs.map((job) => (job.id === editingId ? savedJob : job)),
        );
        setMessage('Job listing updated.');
      } else {
        setJobs((currentJobs) => [...currentJobs, savedJob]);
        setMessage('Job listing added.');
      }

      clearForm();
    } catch {
      setMessage('Could not save the job. Check that the backend is running.');
    }
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setTitle(job.title ?? '');
    setCompany(job.company ?? '');
    setLocation(job.location ?? '');
    setDescription(job.description ?? '');
    setMinimumCgpa(
      job.minimumCgpa == null ? '' : String(job.minimumCgpa),
    );
    setRequiredSkills(job.requiredSkills ?? '');
    setMessage('');
  }

  async function handleDelete(id) {
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete the job.');
      }

      setJobs((currentJobs) => currentJobs.filter((job) => job.id !== id));

      if (editingId === id) {
        clearForm();
      }

      setMessage('Job listing deleted.');
    } catch {
      setMessage('Could not delete the job. Check that the backend is running.');
    }
  }

  return (
    <section>
      <h2>{editingId === null ? 'Add a Job Listing' : 'Edit Job Listing'}</h2>

      <form onSubmit={handleSubmit}>
        <p>
          <label>
            Job title
            <br />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Company
            <br />
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Location
            <br />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Description
            <br />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Minimum CGPA
            <br />
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={minimumCgpa}
              onChange={(event) => setMinimumCgpa(event.target.value)}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Required skills (separate with commas)
            <br />
            <textarea
              value={requiredSkills}
              onChange={(event) => setRequiredSkills(event.target.value)}
              placeholder="Java, SQL, Spring Boot"
              required
            />
          </label>
        </p>

        <button type="submit">
          {editingId === null ? 'Add Job' : 'Save Changes'}
        </button>

        {editingId !== null && (
          <button type="button" onClick={clearForm}>
            Cancel
          </button>
        )}
      </form>

      <p>{message}</p>

      <h2>Job Listings</h2>

      {jobs.length === 0 ? (
        <p>No jobs listed yet.</p>
      ) : (
        <ul>
          {jobs.map((job) => (
            <li key={job.id}>
              <strong>{job.title}</strong> at {job.company} — {job.location}
              {' (Minimum CGPA: '}
              {job.minimumCgpa}
              {')'}
              <br />
              <strong>Required skills:</strong>{' '}
              {job.requiredSkills || 'Not entered yet'}
              <br />
              <button type="button" onClick={() => handleEdit(job)}>
                Edit
              </button>{' '}
              <button type="button" onClick={() => handleDelete(job.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Jobs;