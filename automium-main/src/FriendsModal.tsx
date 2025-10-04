type ReduceTimeOptionsProps = {
  isOpen: boolean;
  onClose: () => void;
  inviteModalRef: React.RefObject<HTMLDivElement>;
};

const InviteModal: React.FC<ReduceTimeOptionsProps> = ({
  isOpen,
  onClose,
  inviteModalRef,
}) => {
  
  return (
    <div
      ref={inviteModalRef}
      style={{
        backdropFilter: "blur(64px)",
        border: "1px solid #FFFFFF33",
        background: "black",
      }}
      className={`fixed  left-1/2 transform -translate-x-1/2  md:max-w-xl bg-black bg-opacity-50  justify-around  z-50 text-xs bottom-0 flex flex-col items-center animate-bounce-once   w-full  transition-transform duration-700 ease-in-out ${
        isOpen
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-full opacity-0 scale-95"
      } text-white p-6 rounded-t-lg shadow-lg`}
    >
      <div className="space-y-3 w-full flex flex-col items-center">
        <div
          className="flex items-center w-full  justify-between p-2 rounded-lg "
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.24)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className=" flex items-center justify-center z-50 w-full">
            <div className=" text-white  rounded-lg w-full">
              <div className="flex justify-between items-center mb-4 w-full">
                <h2 className="text-lg font-semibold text-end w-[60%]">
                  Invite friends
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-300 w-[20%] text-2xl"
                >
                  &times;
                </button>
              </div>
              <button className="w-full bg-white text-black py-2 rounded-lg mb-4">
                Copy invite link
              </button>
              <button className="w-full bg-white text-black  py-2 rounded-lg ">
                Share invite link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
