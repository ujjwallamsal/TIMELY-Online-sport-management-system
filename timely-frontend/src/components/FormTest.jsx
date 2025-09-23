import React, { useState } from 'react';
import { Input, Select, Button, useToast } from './ui';

const FormTest = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const { success, error } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      success('Form submitted successfully!');
      console.log('Form data:', formData);
    } else {
      error('Please fix the errors above');
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'guest', label: 'Guest' }
  ];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Form Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label="Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter your name"
          required
        />
        
        <Input
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          required
        />
        
        <Select
          name="role"
          label="Role"
          value={formData.role}
          onChange={handleSelectChange}
          options={roleOptions}
          placeholder="Select a role"
          error={errors.role}
          required
        />
        
        <Input
          name="message"
          label="Message"
          as="textarea"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          placeholder="Enter your message"
        />
        
        <Button type="submit" className="w-full">
          Submit Form
        </Button>
      </form>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Current Form Data:</h3>
        <pre className="text-sm text-gray-600">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default FormTest;
