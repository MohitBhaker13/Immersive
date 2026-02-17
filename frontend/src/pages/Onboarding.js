import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { MOOD_OPTIONS } from '@/utils/constants';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

const Onboarding = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reading_type: 'Fiction',
    daily_goal_minutes: 30,
    default_mood: 'Focus',
    sound_enabled: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post('/auth/onboarding', formData);
      toast.success('Welcome to Immersive!');
      navigate('/dashboard', { state: { user: { ...user, ...formData } } });
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to save preferences');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1] paper-texture px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="card-paper p-6 md:p-12">
          <div className="text-center mb-6 md:mb-8">
            <BookOpen className="w-10 h-10 md:w-12 md:h-12 mx-auto text-[#A68A64] mb-4" />
            <h1
              className="text-3xl md:text-4xl font-bold text-[#2C2A27] mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Welcome, {user?.name?.split(' ')[0] || 'Reader'}
            </h1>
            <p className="text-[#6A645C] text-sm md:text-base" style={{ fontFamily: 'Lora, serif' }}>
              Let's personalize your reading experience
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            {/* Reading Type */}
            <div>
              <label className="block text-[#2C2A27] font-medium mb-3 text-sm md:text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                What do you mostly read?
              </label>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {['Fiction', 'Non-Fiction', 'Both'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    data-testid={`reading-type-${type.toLowerCase()}-btn`}
                    onClick={() => setFormData({ ...formData, reading_type: type })}
                    className={`py-3 px-3 md:px-4 rounded-md border transition-colors text-sm md:text-base ${formData.reading_type === type
                        ? 'bg-[#A68A64] text-white border-[#A68A64]'
                        : 'bg-white text-[#2C2A27] border-[#E8E3D9] active:border-[#A68A64]'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Goal */}
            <div>
              <label className="block text-[#2C2A27] font-medium mb-3 text-sm md:text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                Daily reading goal (minutes)
              </label>
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {[15, 30, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    data-testid={`goal-${minutes}-btn`}
                    onClick={() => setFormData({ ...formData, daily_goal_minutes: minutes })}
                    className={`py-3 px-3 md:px-4 rounded-md border transition-colors text-sm md:text-base ${formData.daily_goal_minutes === minutes
                        ? 'bg-[#A68A64] text-white border-[#A68A64]'
                        : 'bg-white text-[#2C2A27] border-[#E8E3D9] active:border-[#A68A64]'
                      }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>


            {/* Sound Preference */}
            <div>
              <label className="block text-[#2C2A27] font-medium mb-3 text-sm md:text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sound preference
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                  type="button"
                  data-testid="sound-on-btn"
                  onClick={() => setFormData({ ...formData, sound_enabled: true })}
                  className={`py-3 px-3 md:px-4 rounded-md border transition-colors text-sm md:text-base ${formData.sound_enabled
                      ? 'bg-[#A68A64] text-white border-[#A68A64]'
                      : 'bg-white text-[#2C2A27] border-[#E8E3D9] active:border-[#A68A64]'
                    }`}
                >
                  Sound On
                </button>
                <button
                  type="button"
                  data-testid="sound-off-btn"
                  onClick={() => setFormData({ ...formData, sound_enabled: false })}
                  className={`py-3 px-3 md:px-4 rounded-md border transition-colors text-sm md:text-base ${!formData.sound_enabled
                      ? 'bg-[#A68A64] text-white border-[#A68A64]'
                      : 'bg-white text-[#2C2A27] border-[#E8E3D9] active:border-[#A68A64]'
                    }`}
                >
                  Sound Off
                </button>
              </div>
            </div>

            <button
              type="submit"
              data-testid="complete-onboarding-btn"
              className="w-full btn-paper-accent py-3 text-base mt-6 md:mt-8"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Start Reading
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;