import React, { useEffect } from 'react';
import { PublicRoom } from '../types/websocket';
import '../styles/PublicRoomsPage.css';

interface PublicRoomsPageProps {
  rooms: PublicRoom[];
  onJoinRoom: (code: string) => void;
  onListRooms: () => void;
  onBack: () => void;
}

const PublicRoomsPage: React.FC<PublicRoomsPageProps> = ({
  rooms,
  onJoinRoom,
  onListRooms,
  onBack
}) => {
  useEffect(() => {
    onListRooms();
  }, []);

  return (
    <div className="public-rooms-page">
      <div className="public-rooms-container">
        <div className="public-rooms-header">
          <button className="btn-back" onClick={onBack}>← Retour</button>
          <h2>Salles publiques</h2>
          <button className="btn-refresh" onClick={onListRooms}>Actualiser</button>
        </div>

        {rooms.length === 0 ? (
          <div className="no-rooms">
            <p>Aucune salle publique disponible.</p>
            <p className="no-rooms-hint">Créez une salle publique pour que d'autres joueurs puissent vous rejoindre !</p>
          </div>
        ) : (
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Hôte</th>
                <th>Joueurs</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id}>
                  <td>{room.hostName}</td>
                  <td>{room.playerCount}/2</td>
                  <td>
                    <span className={`room-status ${room.status}`}>
                      {room.status === 'waiting' ? 'En attente' : 'En cours'}
                    </span>
                  </td>
                  <td>
                    {room.status === 'waiting' && room.playerCount < 2 && (
                      <button
                        className="btn-join-room"
                        onClick={() => onJoinRoom(room.id)}
                      >
                        Rejoindre
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PublicRoomsPage;
