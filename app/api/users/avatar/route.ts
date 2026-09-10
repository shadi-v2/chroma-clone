import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findUserById, updateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        {
          message: "No avatar uploaded",
        },
        {
          status: 400,
        },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "chromadiaries/avatars",
      resource_type: "image",
      transformation: [
        {
          width: 600,
          height: 600,
          crop: "fill",
          gravity: "face",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("AVATAR UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Avatar upload failed",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { avatar, avatarPublicId } = await req.json();

    const user = await findUserById(currentUser.id || currentUser._id);

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // DELETE OLD AVATAR
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (error) {
        console.error("Failed to delete old avatar:", error);
      }
    }

    await updateUser(currentUser.id || currentUser._id, {
      avatar,
      avatarPublicId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("AVATAR UPDATE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update avatar",
      },
      {
        status: 500,
      },
    );
  }
}
