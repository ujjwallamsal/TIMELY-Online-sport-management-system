import { useState } from 'react';

export default function FixtureGenerator({ 
  event, 
  participants = [], 
  venues = [], 
  onGenerate,
  onCancel 
}) {
  const [tournamentType, setTournamentType] = useState('round_robin');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [matchDuration, setMatchDuration] = useState(90);
  const [breakDuration, setBreakDuration] = useState(15);
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || selectedVenues.length === 0) {
      alert('Please select start date and venues');
      return;
    }

    setGenerating(true);
    try {
      const fixtures = generateFixtures();
      await onGenerate(fixtures);
    } catch (error) {
      console.error('Fixture generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateFixtures = () => {
    const fixtures = [];
    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    if (tournamentType === 'round_robin') {
      fixtures.push(...generateRoundRobin(startDateTime));
    } else {
      fixtures.push(...generateKnockout(startDateTime));
    }
    
    return fixtures;
  };

  const generateRoundRobin = (startDateTime) => {
    const fixtures = [];
    const teams = [...participants];
    
    // If odd number of teams, add a "bye" team
    if (teams.length % 2 !== 0) {
      teams.push({ id: 'bye', name: 'BYE' });
    }
    
    const rounds = teams.length - 1;
    const halfSize = teams.length / 2;
    
    for (let round = 0; round < rounds; round++) {
      const roundFixtures = [];
      
      for (let i = 0; i < halfSize; i++) {
        const team1 = teams[i];
        const team2 = teams[teams.length - 1 - i];
        
        if (team1.id !== 'bye' && team2.id !== 'bye') {
          const matchTime = new Date(startDateTime);
          matchTime.setDate(matchTime.getDate() + round);
          matchTime.setHours(matchTime.getHours() + (i * 2));
          
          roundFixtures.push({
            round: round + 1,
            team_a: team1,
            team_b: team2,
            scheduled_at: matchTime,
            venue: selectedVenues[i % selectedVenues.length],
            status: 'SCHEDULED'
          });
        }
      }
      
      fixtures.push(...roundFixtures);
      
      // Rotate teams for next round (except first team)
      teams.splice(1, 0, teams.pop());
    }
    
    return fixtures;
  };

  const generateKnockout = (startDateTime) => {
    const fixtures = [];
    const teams = [...participants];
    const rounds = Math.ceil(Math.log2(teams.length));
    
    // Fill with byes if needed
    while (teams.length < Math.pow(2, rounds)) {
      teams.push({ id: `bye_${teams.length}`, name: 'BYE' });
    }
    
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      const roundFixtures = [];
      
      for (let match = 0; match < matchesInRound; match++) {
        const matchTime = new Date(startDateTime);
        matchTime.setDate(matchTime.getDate() + (round - 1) * 2);
        matchTime.setHours(matchTime.getHours() + (match * 3));
        
        roundFixtures.push({
          round: round,
          match_number: match + 1,
          team_a: null, // Will be filled based on previous round results
          team_b: null,
          scheduled_at: matchTime,
          venue: selectedVenues[match % selectedVenues.length],
          status: 'SCHEDULED',
          is_knockout: true
        });
      }
      
      fixtures.push(...roundFixtures);
    }
    
    return fixtures;
  };

  const toggleVenue = (venueId) => {
    setSelectedVenues(prev => 
      prev.includes(venueId) 
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  const getParticipantCount = () => participants.length;
  const getEstimatedRounds = () => {
    if (tournamentType === 'round_robin') {
      return Math.max(1, participants.length - 1);
    } else {
      return Math.ceil(Math.log2(participants.length));
    }
  };
  const getEstimatedMatches = () => {
    if (tournamentType === 'round_robin') {
      return (participants.length * (participants.length - 1)) / 2;
    } else {
      return participants.length - 1;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Generate Fixtures</h3>
        <p className="text-gray-600">Create match schedule for {event?.name}</p>
      </div>
      <div className="card-body">
        <div className="space-y-6">
          {/* Tournament Type Selection */}
          <div className="form-group">
            <label className="form-label">Tournament Format</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tournamentType"
                  value="round_robin"
                  checked={tournamentType === 'round_robin'}
                  onChange={(e) => setTournamentType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">🔄 Round Robin</div>
                  <div className="text-sm text-gray-500">Everyone plays everyone</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tournamentType"
                  value="knockout"
                  checked={tournamentType === 'knockout'}
                  onChange={(e) => setTournamentType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">🏆 Knockout</div>
                  <div className="text-sm text-gray-500">Single elimination</div>
                </div>
              </label>
            </div>
          </div>

          {/* Tournament Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Tournament Overview</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{getParticipantCount()}</div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{getEstimatedRounds()}</div>
                <div className="text-sm text-gray-600">Rounds</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{getEstimatedMatches()}</div>
                <div className="text-sm text-gray-600">Matches</div>
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Match Duration (minutes)</label>
              <input
                type="number"
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                className="form-input"
                min="30"
                max="180"
                step="15"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Break Between Matches (minutes)</label>
              <input
                type="number"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="form-input"
                min="0"
                max="60"
                step="5"
              />
            </div>
          </div>

          {/* Venue Selection */}
          <div className="form-group">
            <label className="form-label">Select Venues</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {venues.map(venue => (
                <label key={venue.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedVenues.includes(venue.id)}
                    onChange={() => toggleVenue(venue.id)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{venue.name}</div>
                    <div className="text-sm text-gray-500">{venue.address}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedVenues.length === 0 && (
              <p className="text-sm text-red-600 mt-2">Please select at least one venue</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            
            <button
              onClick={handleGenerate}
              disabled={generating || !startDate || selectedVenues.length === 0}
              className="btn btn-primary flex-1"
            >
              {generating ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Generating Fixtures...
                </>
              ) : (
                '🎯 Generate Fixtures'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
